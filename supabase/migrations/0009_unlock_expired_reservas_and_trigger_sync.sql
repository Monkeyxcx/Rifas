-- =================================================================
-- 0009_UNLOCK_EXPIRED_RESERVAS.SQL · RifasCenter
--
-- Problema que resuelve:
--   71 reservas status='reserved' con 0 pagos; 70 vencidas el 08 sep
--   siguen status='reserved' bloqueando números FOREVER.
--
-- Fixes en esta migración:
--   1) Garantiza UNIQUE PARTIAL WHERE status IN ('reserved','paid')
--      (nunca UNIQUE TOTAL rifa_id,number que bloquea recompra expired).
--   2) Trigger AUTOMÁTICO sync_rifa_available_numbers que recalcula
--      rifas.available_numbers = total - COUNT(status in('reserved','paid'))
--      tras cada INSERT/UPDATE/DELETE en reservas. Elimina drift
--      permanentemente (no hay que acordarse de manual UPDATE).
--   3) REPAIR HOY: pasa 70 filas vencidas → status='expired'.
--      Trigger dispara solo, available_numbers salta a 99 correcto.
-- =================================================================

-- 1) 🔒 UNIQUE PARTIAL correcto (SIEMPRE): solo bloquea rifa+numero
--    si está reserved or paid. expired/cancelled/refunded se libera.
ALTER TABLE IF EXISTS public.reservas
    DROP CONSTRAINT IF EXISTS reservas_unique_active_per_rifa;

DROP INDEX IF EXISTS public.reservas_one_active_per_rifa_number_idx;
CREATE UNIQUE INDEX reservas_one_active_per_rifa_number_idx
    ON public.reservas (rifa_id, number)
    WHERE status IN ('reserved','paid');

-- 2) 🎯 TRIGGER AUTOMÁTICO: sync_rifa_available_numbers
--    Nunca más drift available_numbers vs conteo real reservas.
CREATE OR REPLACE FUNCTION public.sync_rifa_available_numbers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_rifa_id UUID;
    v_count_occupied INT;
    v_total INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_rifa_id := OLD.rifa_id;
    ELSE
        v_rifa_id := NEW.rifa_id;
    END IF;

    SELECT total_numbers INTO STRICT v_total
      FROM public.rifas
     WHERE id = v_rifa_id;

    SELECT COALESCE(COUNT(*), 0)::INT INTO v_count_occupied
      FROM public.reservas
     WHERE rifa_id = v_rifa_id
       AND status IN ('reserved','paid');

    UPDATE public.rifas
       SET available_numbers = GREATEST(0, LEAST(v_total, v_total - v_count_occupied)),
           updated_at = NOW()
     WHERE id = v_rifa_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rifa_available ON public.reservas;
CREATE TRIGGER trg_sync_rifa_available
AFTER INSERT OR UPDATE OR DELETE ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.sync_rifa_available_numbers();

-- 3) 🧹 REPAIR HOY: pasa status=reserved Y expired HACE MÁS DE 15 MIN
--    a status='expired'. Trigger arriba dispara AUTOMÁTICO y ajusta
--    rifas.available_numbers sin que tengamos que contar manualmente.
--    (WHERE estricto para NO tocar ni 1 fila pagada, reservada activa, etc.)
UPDATE public.reservas
   SET status       = 'expired',
       updated_at   = NOW()
 WHERE status = 'reserved'
   AND expires_at < NOW() - INTERVAL '15 minutes'
   AND NOT EXISTS (
       SELECT 1 FROM public.pagos p
        WHERE (p.reserva_id = reservas.id
           OR  p.mercado_pago_preference_id IN (
               SELECT mercado_pago_preference_id FROM public.pagos
           ))  -- filtros extra seguridad: no hay pagos asociados
   );
