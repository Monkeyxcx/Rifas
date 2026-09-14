-- =================================================================
-- 0013 · Pagos manuales del creador: Nequi + Bancolombia
-- =================================================================

-- -------------------------------------------------
-- 1. Verificación del creador (extensión incremental)
-- -------------------------------------------------
ALTER TABLE public.user_nequi_verifications
    ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
    ADD COLUMN IF NOT EXISTS bancolombia_qr_url TEXT,
    ADD COLUMN IF NOT EXISTS bancolombia_account_label TEXT;

UPDATE public.user_nequi_verifications v
SET account_holder_name = COALESCE(v.account_holder_name, p.full_name)
FROM public.profiles p
WHERE p.id = v.user_id
  AND (v.account_holder_name IS NULL OR btrim(v.account_holder_name) = '');

-- -------------------------------------------------
-- 2. Métodos manuales por rifa
-- -------------------------------------------------
ALTER TABLE public.rifa_payment_methods
    ALTER COLUMN accept_mercado_pago SET DEFAULT FALSE;

UPDATE public.rifa_payment_methods
SET accept_mercado_pago = FALSE
WHERE accept_mercado_pago = TRUE;

ALTER TABLE public.rifa_payment_methods
    ADD COLUMN IF NOT EXISTS accept_bancolombia_qr BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS accept_bancolombia_transfer BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bancolombia_qr_override_url TEXT,
    ADD COLUMN IF NOT EXISTS bancolombia_account_override TEXT;

-- -------------------------------------------------
-- 3. Comprobantes manuales (manteniendo tabla legacy)
-- -------------------------------------------------
ALTER TABLE public.nequi_payments
    ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(40) NOT NULL DEFAULT 'nequi'
        CONSTRAINT nequi_payments_method_type_check CHECK (
            payment_method_type IN ('nequi', 'bancolombia_qr', 'bancolombia_transfer')
        );

CREATE INDEX IF NOT EXISTS idx_nequi_payments_payment_method_type
    ON public.nequi_payments(payment_method_type);

-- -------------------------------------------------
-- 4. Vista rápida del creador para checkout / perfil
-- -------------------------------------------------
DROP VIEW IF EXISTS public.user_nequi_status;

CREATE OR REPLACE VIEW public.user_nequi_status AS
SELECT
    p.id AS user_id,
    (v.id IS NOT NULL AND v.status = 'approved') AS nequi_verified,
    v.nequi_phone,
    v.nequi_qr_url,
    v.account_holder_name,
    v.bancolombia_qr_url,
    v.bancolombia_account_label,
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
