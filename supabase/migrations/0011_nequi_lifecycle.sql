-- =================================================================
-- 0011_NEQUI_LIFECYCLE.SQL · RifasCenter
-- Pago en efectivo / Nequi: verificación creadores + vouchers
-- =================================================================

-- --------------------
-- 0. profiles.is_admin (admin panel dashboard user)
-- --------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) DEFAULT 0;

-- --------------------
-- 1. USER_NEQUI_VERIFICATIONS
--    Solicitud de verificación para creadores que quieren cobrar por Nequi
-- --------------------
CREATE TABLE IF NOT EXISTS public.user_nequi_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nequi_phone VARCHAR(15) NOT NULL,
    document_type VARCHAR(10) NOT NULL DEFAULT 'CC',
    document_number VARCHAR(30) NOT NULL,
    document_image_url TEXT NOT NULL,
    nequi_certificate_url TEXT NOT NULL,
    nequi_qr_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT nequi_verif_status_check CHECK (status IN ('pending','approved','rejected')),
    review_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nequi_verif_user_id ON public.user_nequi_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_nequi_verif_status ON public.user_nequi_verifications(status);
CREATE INDEX IF NOT EXISTS idx_nequi_verif_created_at ON public.user_nequi_verifications(created_at DESC);

DROP TRIGGER IF EXISTS set_nequi_verif_updated_at ON public.user_nequi_verifications;
CREATE TRIGGER set_nequi_verif_updated_at BEFORE UPDATE ON public.user_nequi_verifications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------
-- 2. RIFA_PAYMENT_METHODS (1-a-1 con rifas) — qué métodos acepta la rifa
-- --------------------
CREATE TABLE IF NOT EXISTS public.rifa_payment_methods (
    rifa_id UUID PRIMARY KEY REFERENCES public.rifas(id) ON DELETE CASCADE,
    accept_mercado_pago BOOLEAN NOT NULL DEFAULT TRUE,
    accept_nequi BOOLEAN NOT NULL DEFAULT FALSE,
    nequi_phone_override VARCHAR(15),
    nequi_qr_override_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_rifa_pm_updated_at ON public.rifa_payment_methods;
CREATE TRIGGER set_rifa_pm_updated_at BEFORE UPDATE ON public.rifa_payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-insert row al crear una rifa (default MP on, Nequi off)
CREATE OR REPLACE FUNCTION public.handle_rifa_payment_methods_init()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.rifa_payment_methods (rifa_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_rifa_created_pm_init ON public.rifas;
CREATE TRIGGER on_rifa_created_pm_init
    AFTER INSERT ON public.rifas
    FOR EACH ROW EXECUTE FUNCTION public.handle_rifa_payment_methods_init();

-- --------------------
-- 3. NEQUI_PAYMENTS (comprobantes subidos por participantes)
-- --------------------
CREATE TABLE IF NOT EXISTS public.nequi_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rifa_id UUID NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reserva_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
    numbers VARCHAR(4)[] NOT NULL DEFAULT '{}'::VARCHAR(4)[],
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    voucher_image_url TEXT NOT NULL,
    voucher_reference VARCHAR(80),
    payer_phone VARCHAR(15),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT nequi_payments_status_check CHECK (status IN ('pending','approved','rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nequi_payments_rifa_id ON public.nequi_payments(rifa_id);
CREATE INDEX IF NOT EXISTS idx_nequi_payments_user_id ON public.nequi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_nequi_payments_status ON public.nequi_payments(status);
CREATE INDEX IF NOT EXISTS idx_nequi_payments_created_at ON public.nequi_payments(created_at DESC);

DROP TRIGGER IF EXISTS set_nequi_payments_updated_at ON public.nequi_payments;
CREATE TRIGGER set_nequi_payments_updated_at BEFORE UPDATE ON public.nequi_payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =================================================================
-- RLS POLICIES
-- =================================================================
ALTER TABLE public.user_nequi_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rifa_payment_methods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nequi_payments          ENABLE ROW LEVEL SECURITY;

-- --------------------
-- user_nequi_verifications
--   SELECT/INSERT: propio usuario (status pending propio). Admins: ALL.
--   UPDATE: SOLO admins. Usuario NO PUEDE EDITAR después de submit.
-- --------------------
DROP POLICY IF EXISTS nequi_verif_select_self_or_admin ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_select_self_or_admin ON public.user_nequi_verifications FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = TRUE
    )
);

DROP POLICY IF EXISTS nequi_verif_insert_self ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_insert_self ON public.user_nequi_verifications FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND status = 'pending'
);

DROP POLICY IF EXISTS nequi_verif_update_admin_only ON public.user_nequi_verifications;
CREATE POLICY nequi_verif_update_admin_only ON public.user_nequi_verifications FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- --------------------
-- rifa_payment_methods
--   SELECT: público (participantes necesitan saber si acepta Nequi)
--   INSERT/UPDATE/DELETE: SOLO creador de la rifa
-- --------------------
DROP POLICY IF EXISTS rifa_pm_select_public ON public.rifa_payment_methods;
CREATE POLICY rifa_pm_select_public ON public.rifa_payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS rifa_pm_write_creator ON public.rifa_payment_methods;
CREATE POLICY rifa_pm_write_creator ON public.rifa_payment_methods FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.rifas
        WHERE id = rifa_payment_methods.rifa_id AND creator_id = auth.uid()
    )
);

DROP POLICY IF EXISTS rifa_pm_update_creator ON public.rifa_payment_methods;
CREATE POLICY rifa_pm_update_creator ON public.rifa_payment_methods FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM public.rifas WHERE id = rifa_id AND creator_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.rifas WHERE id = rifa_id AND creator_id = auth.uid())
);

-- --------------------
-- nequi_payments (comprobantes)
--   SELECT: pagador user_id, CREADOR rifa, ADMINS.
--   INSERT: user_id = auth.uid()
--   UPDATE: creador rifa + admins (approve/reject)
-- --------------------
DROP POLICY IF EXISTS nequi_payments_select_owner_creator_admin ON public.nequi_payments;
CREATE POLICY nequi_payments_select_owner_creator_admin ON public.nequi_payments FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

DROP POLICY IF EXISTS nequi_payments_insert_self ON public.nequi_payments;
CREATE POLICY nequi_payments_insert_self ON public.nequi_payments FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND status = 'pending'
);

DROP POLICY IF EXISTS nequi_payments_update_creator_admin ON public.nequi_payments;
CREATE POLICY nequi_payments_update_creator_admin ON public.nequi_payments FOR UPDATE
USING (
    auth.uid() IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
)
WITH CHECK (
    auth.uid() IN (SELECT creator_id FROM public.rifas WHERE id = nequi_payments.rifa_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- =================================================================
-- VIEWS ÚTILES
-- =================================================================

-- Creador consulta rápida: verificación aprobada?
CREATE OR REPLACE VIEW public.user_nequi_status AS
SELECT
    p.id AS user_id,
    (v.id IS NOT NULL AND v.status = 'approved') AS nequi_verified,
    v.nequi_phone,
    v.nequi_qr_url,
    v.status AS verification_status,
    v.reviewed_at
FROM public.profiles p
LEFT JOIN LATERAL (
    SELECT v.*
    FROM public.user_nequi_verifications v
    WHERE v.user_id = p.id
    ORDER BY v.created_at DESC
    LIMIT 1
) v ON TRUE;
