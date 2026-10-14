-- =================================================================
-- 0015_ADVISOR_FIXES.SQL · RifasCenter
-- Corrige hallazgos Supabase advisors (security ERROR/WARN + performance):
--  1) Vistas SECURITY DEFINER -> security_invoker + lockdown user_nequi_status
--  2) Funciones sin search_path -> SET search_path = public
--  3) EXECUTE en funciones trigger/RPC -> revoke innecesarios
--  4) FK sin índice -> crear 3 índices
--  5) RLS auth_rls_initplan -> auth.uid() => (select auth.uid())
-- Idempotente: todo con IF EXISTS / OR REPLACE / DROP IF EXISTS.
-- =================================================================

-- =====================
-- 1. VISTAS: security_invoker (cierra ERROR security_definer_view)
-- =====================
ALTER VIEW IF EXISTS public.rifa_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_nequi_status SET (security_invoker = true);

-- rifa_stats es agregada pública (rifas activas visibles por RLS) -> mantener acceso
GRANT SELECT ON public.rifa_stats TO anon, authenticated;

-- user_nequi_status expone teléfonos/documentos del creador: SOLO server
-- (checkout la lee con service_role). Cierra lectura directa anon/authenticated.
REVOKE ALL ON public.user_nequi_status FROM anon, authenticated;

-- =====================
-- 2. SEARCH_PATH en funciones (cierra WARN function_search_path_mutable)
-- Cuerpos usan public.* calificado o sin tablas -> SET public es seguro.
-- =====================
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.auto_close_rifa_when_sold_out() SET search_path = public;
ALTER FUNCTION public._split_numbers_csv(TEXT) SET search_path = public;
ALTER FUNCTION public.handle_rifa_payment_methods_init() SET search_path = public;
ALTER FUNCTION public.prevent_profiles_privilege_escalation() SET search_path = public;
ALTER FUNCTION public.sync_rifa_available_numbers() SET search_path = public;

-- =====================
-- 3. EXECUTE: revocar lo innecesario (cierra WARN anon/authenticated_definer)
-- Trigger-helpers: nadie los llama por RPC -> revoke total.
-- buy_reservations / expire_rifa_reservations: solo authenticated (+service_role).
-- =====================
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.auto_close_rifa_when_sold_out() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public._split_numbers_csv(TEXT) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_rifa_payment_methods_init() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.prevent_profiles_privilege_escalation() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.sync_rifa_available_numbers() FROM anon, authenticated, public;

REVOKE ALL ON FUNCTION public.buy_reservations(UUID, UUID, VARCHAR(4)[]) FROM anon, public;
REVOKE ALL ON FUNCTION public.expire_rifa_reservations(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.buy_reservations(UUID, UUID, VARCHAR(4)[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_rifa_reservations(UUID) TO authenticated;

-- =====================
-- 4. FK sin índice (INFO performance con impacto real en joins)
-- =====================
CREATE INDEX IF NOT EXISTS idx_nequi_payments_reviewed_by
    ON public.nequi_payments(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_notifications_rifa_id
    ON public.notifications(rifa_id);
CREATE INDEX IF NOT EXISTS idx_nequi_verif_review_admin_id
    ON public.user_nequi_verifications(review_admin_id);

-- =====================
-- 5. RLS INITPLAN: (select auth.uid()) para no re-evaluar por fila (WARN x20)
-- Semántica idéntica a 0002/0011/0012, solo envuelve auth.uid().
-- =====================

-- ---- PROFILES ----
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = id);

-- ---- RIFAS ----
DROP POLICY IF EXISTS rifas_select_visible ON public.rifas;
CREATE POLICY rifas_select_visible ON public.rifas FOR SELECT USING (
    status IN ('active','closed','finished')
    OR ((select auth.uid()) IS NOT NULL AND creator_id = (select auth.uid()))
);

DROP POLICY IF EXISTS rifas_insert_creator ON public.rifas;
CREATE POLICY rifas_insert_creator ON public.rifas FOR INSERT
    WITH CHECK (
        (select auth.uid()) IS NOT NULL
        AND creator_id = (select auth.uid())
        AND status IN ('draft','active')
    );

DROP POLICY IF EXISTS rifas_update_creator ON public.rifas;
CREATE POLICY rifas_update_creator ON public.rifas FOR UPDATE
    USING (creator_id = (select auth.uid()))
    WITH CHECK (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS rifas_delete_creator_draft ON public.rifas;
CREATE POLICY rifas_delete_creator_draft ON public.rifas FOR DELETE
    USING (creator_id = (select auth.uid()));

-- ---- RESERVAS ----
DROP POLICY IF EXISTS reservas_select_owner_or_creator ON public.reservas;
CREATE POLICY reservas_select_owner_or_creator ON public.reservas FOR SELECT USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (
        SELECT creator_id FROM public.rifas WHERE id = reservas.rifa_id
    )
);

DROP POLICY IF EXISTS reservas_insert_auth_user ON public.reservas;
CREATE POLICY reservas_insert_auth_user ON public.reservas FOR INSERT
    WITH CHECK (
        (select auth.uid()) IS NOT NULL
        AND user_id = (select auth.uid())
        AND status = 'reserved'
    );

-- ---- PAGOS ----
DROP POLICY IF EXISTS pagos_select_owner_or_creator ON public.pagos;
CREATE POLICY pagos_select_owner_or_creator ON public.pagos FOR SELECT USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (
        SELECT creator_id FROM public.rifas WHERE id = pagos.rifa_id
    )
);

-- ---- NOTIFICATIONS ----
DROP POLICY IF EXISTS notifications_select_self ON public.notifications;
CREATE POLICY notifications_select_self ON public.notifications FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS notifications_update_self ON public.notifications;
CREATE POLICY notifications_update_self ON public.notifications FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ---- USER_NEQUI_VERIFICATIONS ----
DROP POLICY IF EXISTS nequi_verif_select_self_or_admin ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_select_self_or_admin ON public.user_nequi_verifications FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid()) AND is_admin = TRUE
    )
);

DROP POLICY IF EXISTS nequi_verif_insert_self ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_insert_self ON public.user_nequi_verifications FOR INSERT
WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND user_id = (select auth.uid())
    AND status = 'pending'
);

DROP POLICY IF EXISTS nequi_verif_update_admin_only ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_update_admin_only ON public.user_nequi_verifications FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND is_admin = TRUE)
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND is_admin = TRUE)
);

-- ---- RIFA_PAYMENT_METHODS ----
DROP POLICY IF EXISTS rifa_pm_write_creator ON public.rifa_payment_methods;
CREATE POLICY rifa_pm_write_creator ON public.rifa_payment_methods FOR INSERT
WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.rifas
        WHERE id = rifa_payment_methods.rifa_id AND creator_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS rifa_pm_update_creator ON public.rifa_payment_methods;
CREATE POLICY rifa_pm_update_creator ON public.rifa_payment_methods FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.rifas WHERE id = rifa_id AND creator_id = (select auth.uid()))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.rifas WHERE id = rifa_id AND creator_id = (select auth.uid()))
);

-- ---- NEQUI_PAYMENTS ----
DROP POLICY IF EXISTS nequi_payments_select_owner_creator_admin ON public.nequi_payments;
CREATE POLICY nequi_payments_select_owner_creator_admin ON public.nequi_payments FOR SELECT USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND is_admin = TRUE)
);

DROP POLICY IF EXISTS nequi_payments_insert_self ON public.nequi_payments;
CREATE POLICY nequi_payments_insert_self ON public.nequi_payments FOR INSERT
WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND user_id = (select auth.uid())
    AND status = 'pending'
);

DROP POLICY IF EXISTS nequi_payments_update_creator_admin ON public.nequi_payments;
CREATE POLICY nequi_payments_update_creator_admin ON public.nequi_payments FOR UPDATE
USING (
    (select auth.uid()) IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND is_admin = TRUE)
)
WITH CHECK (
    (select auth.uid()) IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND is_admin = TRUE)
);

-- ---- CREATOR_FEE_CHARGES ----
DROP POLICY IF EXISTS creator_fee_charges_select_creator_or_admin ON public.creator_fee_charges;
CREATE POLICY creator_fee_charges_select_creator_or_admin
ON public.creator_fee_charges
FOR SELECT
USING (
    creator_id = (select auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.is_admin = TRUE
    )
);
