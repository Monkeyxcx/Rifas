-- =========================================================
-- 0012 · Comisión del creador después de 50 ventas pagadas
-- =========================================================

CREATE TABLE IF NOT EXISTS public.creator_fee_charges (
    rifa_id UUID PRIMARY KEY REFERENCES public.rifas(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_ticket_count INTEGER NOT NULL DEFAULT 50,
    fee_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.03,
    fee_base_amount NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(12, 2) NOT NULL,
    paid_tickets_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CONSTRAINT creator_fee_charges_status_check CHECK (status IN ('pending','approved','cancelled')),
    mercado_pago_payment_id TEXT UNIQUE,
    mercado_pago_preference_id TEXT,
    external_reference TEXT,
    threshold_reached_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_fee_charges_creator_id
    ON public.creator_fee_charges(creator_id);

CREATE INDEX IF NOT EXISTS idx_creator_fee_charges_status
    ON public.creator_fee_charges(status);

CREATE INDEX IF NOT EXISTS idx_creator_fee_charges_threshold_reached_at
    ON public.creator_fee_charges(threshold_reached_at DESC);

DROP TRIGGER IF EXISTS set_creator_fee_charges_updated_at ON public.creator_fee_charges;
CREATE TRIGGER set_creator_fee_charges_updated_at
BEFORE UPDATE ON public.creator_fee_charges
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.creator_fee_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_fee_charges_select_creator_or_admin ON public.creator_fee_charges;
CREATE POLICY creator_fee_charges_select_creator_or_admin
ON public.creator_fee_charges
FOR SELECT
USING (
    creator_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = TRUE
    )
);
