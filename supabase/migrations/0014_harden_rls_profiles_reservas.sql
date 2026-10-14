-- =================================================================
-- 0014_HARDEN_RLS_PROFILES_RESERVAS.SQL · RifasCenter
-- Parches P0 RLS: evita escalación is_admin / wallet / auto-paid
-- =================================================================

-- --------------------
-- 1. PROFILES: trigger anti-escalación de privilegios
--    P0-Crítica: profiles_update_self permitía UPDATE is_admin,
--    wallet_balance, is_verified, email vía anon-key directa.
-- --------------------
CREATE OR REPLACE FUNCTION public.prevent_profiles_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := '';
BEGIN
  BEGIN
    v_role := COALESCE(auth.jwt()->>'role', '');
  EXCEPTION WHEN OTHERS THEN
    v_role := '';
  END;

  -- service_role (webhook/cron/admin server) sí puede modificar
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
     OR (OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance)
     OR (OLD.is_verified IS DISTINCT FROM NEW.is_verified)
     OR (OLD.email IS DISTINCT FROM NEW.email) THEN
    RAISE EXCEPTION 'No tienes permiso para modificar campos privilegiados (is_admin/wallet_balance/is_verified/email).';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profiles_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profiles_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profiles_privilege_escalation();

-- --------------------
-- 2. RESERVAS: quitar UPDATE directo a dueños
--    P0-Crítica: reservas_update_owner permitía auto-marcarse paid sin pagar.
--    Webhook/review usan service_role (bypassa RLS), RPC es SECURITY DEFINER.
--    Sin policy UPDATE, anon/authenticated NO pueden UPDATE reservas directo.
-- --------------------
DROP POLICY IF EXISTS reservas_update_owner ON public.reservas;

-- Política explícita de negación (defensa en profundidad: si alguien
-- recrea una policy permisiva, esta deja claro que el update cliente
-- está prohibido; service_role bypassa RLS de todos modos).
-- No creamos ninguna policy FOR UPDATE: por defecto RLS deniega UPDATE.
