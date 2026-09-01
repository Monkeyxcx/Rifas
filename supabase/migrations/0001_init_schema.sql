-- =================================================================
-- 0001_INIT_SCHEMA.SQL · RifasCenter
-- Migración inicial: Tablas base del modelo relacional
-- =================================================================

-- --------------------
-- EXTENSIONS
-- --------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------
-- PROFILES (extensión auth.users)
-- --------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    country TEXT DEFAULT 'CO',
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------
-- RIFAS
-- --------------------
CREATE TABLE IF NOT EXISTS public.rifas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    prize_name VARCHAR(200) NOT NULL,
    prize_image_url TEXT,
    prize_value NUMERIC(12, 2) DEFAULT 0,
    is_solidarity BOOLEAN DEFAULT FALSE,
    cause_name TEXT,
    cause_description TEXT,
    cause_target NUMERIC(12, 2) DEFAULT 0,
    number_price NUMERIC(12, 2) NOT NULL,
    total_numbers INTEGER NOT NULL CONSTRAINT total_numbers_check CHECK (total_numbers BETWEEN 10 AND 100),
    available_numbers INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CONSTRAINT status_check CHECK (status IN ('draft','active','closed','finished','cancelled')),
    ends_at TIMESTAMPTZ,
    draw_date TIMESTAMPTZ,
    draw_instructions TEXT,
    banner_ad_config JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rifas_creator_id ON public.rifas(creator_id);
CREATE INDEX IF NOT EXISTS idx_rifas_status ON public.rifas(status);
CREATE INDEX IF NOT EXISTS idx_rifas_created_at ON public.rifas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rifas_is_solidarity ON public.rifas(is_solidarity);

-- --------------------
-- RESERVAS
-- --------------------
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rifa_id UUID NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    number VARCHAR(4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'reserved' CONSTRAINT reserva_status_check CHECK (status IN ('reserved','paid','cancelled','expired','refunded')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
    reserved_session_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- IMPORTANTE: Constraint UNIQUE parcial para EVITAR DOBLE VENTA.
    -- Un número sólo puede estar reserved/paid una vez por rifa.
    CONSTRAINT reservas_unique_active_per_rifa UNIQUE (rifa_id, number) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_reservas_rifa_id ON public.reservas(rifa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_user_id ON public.reservas(user_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON public.reservas(status);
CREATE INDEX IF NOT EXISTS idx_reservas_expires_at ON public.reservas(expires_at) WHERE status = 'reserved';

-- --------------------
-- PAGOS
-- --------------------
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rifa_id UUID NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reserva_id UUID REFERENCES public.reservas(id) ON DELETE SET NULL,
    mercado_pago_payment_id TEXT UNIQUE,
    mercado_pago_preference_id TEXT,
    external_reference TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CONSTRAINT pago_status_check CHECK (status IN ('pending','approved','rejected','cancelled','refunded','in_process')),
    amount NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(12, 2) DEFAULT 0,
    net_received_amount NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(40),
    payment_type VARCHAR(40),
    installments INTEGER DEFAULT 1,
    payer_email TEXT,
    mercado_pago_raw JSONB DEFAULT '{}'::JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_rifa_id ON public.pagos(rifa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_user_id ON public.pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_reserva_id ON public.pagos(reserva_id);
CREATE INDEX IF NOT EXISTS idx_pagos_status ON public.pagos(status);
CREATE INDEX IF NOT EXISTS idx_pagos_created_at ON public.pagos(created_at DESC);

-- --------------------
-- GANADORES
-- --------------------
CREATE TABLE IF NOT EXISTS public.ganadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rifa_id UUID NOT NULL UNIQUE REFERENCES public.rifas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    winning_number VARCHAR(4) NOT NULL,
    draw_method VARCHAR(40) DEFAULT 'random_org',
    draw_proof JSONB DEFAULT '{}'::JSONB,
    contact_info JSONB DEFAULT '{}'::JSONB,
    prize_delivered BOOLEAN DEFAULT FALSE,
    prize_delivered_at TIMESTAMPTZ,
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ganadores_user_id ON public.ganadores(user_id);

-- --------------------
-- NOTIFICACIONES
-- --------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rifa_id UUID REFERENCES public.rifas(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- --------------------
-- CONSTRAINTS CHECK: available_numbers <= total_numbers
-- --------------------
ALTER TABLE public.rifas ADD CONSTRAINT rifas_available_check
    CHECK (available_numbers >= 0 AND available_numbers <= total_numbers);

-- --------------------
-- TRIGGER: updated_at
-- --------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_rifas_updated_at ON public.rifas;
CREATE TRIGGER set_rifas_updated_at BEFORE UPDATE ON public.rifas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reservas_updated_at ON public.reservas;
CREATE TRIGGER set_reservas_updated_at BEFORE UPDATE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_pagos_updated_at ON public.pagos;
CREATE TRIGGER set_pagos_updated_at BEFORE UPDATE ON public.pagos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------
-- TRIGGER: auto-create profile after user signup
-- --------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, country)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'country', 'CO')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
