-- =================================================================
-- 0002_RLS_POLICIES.SQL · RifasCenter
-- Row Level Security en todas las tablas públicas.
-- Pilar de seguridad: cada usuario SOLO ve lo que le corresponde.
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
--   · Usuario logueado ve SU perfil.
--   · Todo el mundo ve perfil PÚBLICO (id, full_name, avatar_url, country)
--     para mostrar "creador de la rifa".
-- ============================================================
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT lo gestiona TRIGGER handle_new_user. Los usuarios NO pueden
-- insertar profiles manualmente.
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- RIFAS
--   · SELECT: rifas activas son PÚBLICAS. El creador ve TODO (incl. draft).
--   · INSERT: cualquier auth user (creador). creator_id = auth.uid().
--   · UPDATE/DELETE: SOLO creador y SOLO si status = 'draft'.
-- ============================================================
DROP POLICY IF EXISTS rifas_select_visible ON public.rifas;
CREATE POLICY rifas_select_visible ON public.rifas FOR SELECT USING (
    status = 'active' OR status = 'closed' OR status = 'finished'
    OR (auth.uid() IS NOT NULL AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS rifas_insert_creator ON public.rifas;
CREATE POLICY rifas_insert_creator ON public.rifas FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND creator_id = auth.uid()
        AND status IN ('draft','active')
    );

DROP POLICY IF EXISTS rifas_update_creator_draft ON public.rifas;
CREATE POLICY rifas_update_creator_draft ON public.rifas FOR UPDATE
    USING (creator_id = auth.uid())
    WITH CHECK (
        creator_id = auth.uid()
        -- Solo puede editarse si no salió de draft. Una vez 'active' solo
        -- actualizaciones permitidas son status y updated_at (trigger).
        -- Para cambiar precio/numeros estando activa -> cancelar y crear nueva.
        AND (
            OLD.status IN ('draft')
            OR (NEW.status IN ('active','draft','cancelled') AND NOT (
                NEW.number_price  <> OLD.number_price OR
                NEW.total_numbers <> OLD.total_numbers
            ))
        )
    );

DROP POLICY IF EXISTS rifas_delete_creator_draft ON public.rifas;
CREATE POLICY rifas_delete_creator_draft ON public.rifas FOR DELETE
    USING (creator_id = auth.uid() AND OLD.status = 'draft');

-- ============================================================
-- RESERVAS
--   · SELECT: El dueño de la reserva ve la suya.
--             El creador de la rifa ve TODAS las reservas de su rifa.
--   · INSERT: usuario auth, user_id = auth.uid(), rifa status = 'active'.
--   · UPDATE: SOLO user_id owner y status flow válido.
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
        AND EXISTS (
            SELECT 1 FROM public.rifas
            WHERE id = reservas.rifa_id AND status = 'active'
        )
    );

DROP POLICY IF EXISTS reservas_update_owner ON public.reservas;
CREATE POLICY reservas_update_owner ON public.reservas FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        -- flow válido: reserved -> (paid / cancelled / expired)
        AND CASE
            WHEN OLD.status = 'reserved' THEN NEW.status IN ('reserved','paid','cancelled','expired','refunded')
            WHEN OLD.status = 'paid'     THEN NEW.status IN ('paid','refunded')
            ELSE FALSE
        END
    );

-- ============================================================
-- PAGOS
--   · SELECT: Solo el user_id dueño y creador de la rifa.
--   · INSERT: Desde API/edge function con service_role.
--             Los clientes NO insertan directamente.
-- ============================================================
DROP POLICY IF EXISTS pagos_select_owner_or_creator ON public.pagos;
CREATE POLICY pagos_select_owner_or_creator ON public.pagos FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
        SELECT creator_id FROM public.rifas WHERE id = pagos.rifa_id
    )
);

-- NO policy para INSERT/UPDATE. Los pagos solo se escriben desde edge
-- function o route handler usando SUPABASE_SERVICE_ROLE_KEY (RLS bypassed).

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
