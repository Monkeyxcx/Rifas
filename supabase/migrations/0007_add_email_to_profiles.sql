-- =================================================================
-- 0007_ADD_EMAIL_TO_PROFILES.SQL · RifasCenter
-- Fix B#05: /api/auth/exists ILIKE email sobre profiles requiere
-- que la tabla profiles tenga columna email. El trigger signup
-- handle_new_user NO insertaba email. Se backfillea desde auth.users
-- para usuarios ya existentes.
-- =================================================================

-- 1) Agregar columna email a profiles (nullable primero, luego unique)
ALTER TABLE IF EXISTS public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT;

-- 2) Backfill de email para usuarios ya creados (directamente desde auth.users)
--    SECURITY DEFINER nos permite leer auth.users aunque service role no pueda via SQL directo.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
        UPDATE public.profiles SET email = r.email WHERE id = r.id AND email IS NULL;
    END LOOP;
END $$;

-- 3) Actualizar trigger handle_new_user PARA que incluya email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, country, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'country', 'CO'),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email
    WHERE public.profiles.email IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Índice para búsquedas ILIKE rápidas en signup exists pre-check
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
    ON public.profiles USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
    ON public.profiles (LOWER(email));
