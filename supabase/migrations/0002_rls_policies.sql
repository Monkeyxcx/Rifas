-- =================================================================
-- 0002_RLS_POLICIES.SQL · RifasCenter (FIXED PG compatible)
-- Row Level Security en todas las tablas públicas.
-- Pilar de seguridad: cada usuario SOLO ve lo que le corresponde.
-- NOTA: Las restricciones complejas (status flow, edition locked, etc.)
--       se validan en SERVER-SIDE (RPC buy_reservations, route handlers
--       y triggers) porque PG RLS policies NO soportan OLD/NEW refs.
-- =================================================================

-- --------------------
-- 1. Habilitar RLS
-- --------------------
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rifas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ganadores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
--   · SELECT: público (todos ven el perfil público — creators list).
--   · UPDATE: solo el propio user.
--   · INSERT: handled por trigger handle_new_user (0003).
-- ============================================================
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- RIFAS
--   · SELECT: activas/cerradas/finalizadas son PÚBLICAS.
--             Creador ve TODO (incl. draft/cancelled).
--   · INSERT: cualquier auth user con creator_id = auth.uid().
--   · UPDATE/DELETE: SOLO creador.
--     (Las restricciones draft-only vs active se controlan server-side
--      en route handler /rifas/crear y trigger sync_auto_close.)
-- ============================================================
DROP POLICY IF EXISTS rifas_select_visible ON public.rifas;
CREATE POLICY rifas_select_visible ON public.rifas FOR SELECT USING (
    status IN ('active','closed','finished')
    OR (auth.uid() IS NOT NULL AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS rifas_insert_creator ON public.rifas;
CREATE POLICY rifas_insert_creator ON public.rifas FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND creator_id = auth.uid()
        AND status IN ('draft','active')
    );

DROP POLICY IF EXISTS rifas_update_creator ON public.rifas;
CREATE POLICY rifas_update_creator ON public.rifas FOR UPDATE
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS rifas_delete_creator_draft ON public.rifas;
CREATE POLICY rifas_delete_creator_draft ON public.rifas FOR DELETE
    USING (creator_id = auth.uid());

-- ============================================================
-- RESERVAS
--   · SELECT: dueño reserva O creador de la rifa asociada.
--   · INSERT: auth user con user_id = auth.uid(), status reserved.
--   · UPDATE: SOLO user_id dueño (status flow se valida server-side
--             en webhook y RPC buy_reservations + index unique partial).
-- ============================================================
DROP POLICY IF EXISTS reservas_select_owner_or_creator ON public.reservas;
CREATE POLICY reservas_select_owner_or_creator ON public.reservas FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
        SELECT creator_id FROM public.rifas WHERE id = reservas.rifa_id
    )
);

DROP POLICY IF EXISTS reservas_insert_auth_user ON public.reservas;
CREATE POLICY reservas_insert_auth_user ON public.reservas FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
        AND status = 'reserved'
    );

DROP POLICY IF EXISTS reservas_update_owner ON public.reservas;
CREATE POLICY reservas_update_owner ON public.reservas FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- PAGOS
--   · SELECT: dueño user_id O creador rifa.
--   · WRITE: SOLO service role (webhook MP / edge functions).
--            NO hay policy INSERT/UPDATE; RLS lo bloquea para anon.
-- ============================================================
DROP POLICY IF EXISTS pagos_select_owner_or_creator ON public.pagos;
CREATE POLICY pagos_select_owner_or_creator ON public.pagos FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
        SELECT creator_id FROM public.rifas WHERE id = pagos.rifa_id
    )
);

-- ============================================================
-- GANADORES
--   · SELECT: Público (transparencia del sorteo).
--   · WRITE: Service role only.
-- ============================================================
DROP POLICY IF EXISTS ganadores_select_public ON public.ganadores;
CREATE POLICY ganadores_select_public ON public.ganadores FOR SELECT USING (true);

-- ============================================================
-- NOTIFICATIONS
--   · SELECT/UPDATE (mark read): Solo user_id.
--   · INSERT: service role (sistema dispara notificaciones).
-- ============================================================
DROP POLICY IF EXISTS notifications_select_self ON public.notifications;
CREATE POLICY notifications_select_self ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_self ON public.notifications;
CREATE POLICY notifications_update_self ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- VISTA PÚBLICA: rifa_stats
-- Todos (incl. anónimos) necesitan ver "vendidos / totales / precio"
-- sin leakear datos privados.
-- ============================================================
CREATE OR REPLACE VIEW public.rifa_stats AS
SELECT
    r.id                         AS rifa_id,
    r.total_numbers,
    r.available_numbers,
    (r.total_numbers - r.available_numbers) AS sold_numbers,
    ROUND(
        100.0 * (r.total_numbers - r.available_numbers) /
        NULLIF(r.total_numbers, 0), 1
    )                            AS sold_percentage,
    r.number_price,
    r.status,
    r.created_at,
    r.ends_at,
    r.draw_date
FROM public.rifas r
WHERE r.status IN ('active','closed','finished');
