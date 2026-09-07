-- =================================================================
-- 0006_FIX_RESERVAS_UNIQUE_PARTIAL.SQL · RifasCenter
-- Root cause: reservas_unique_active_per_rifa (UNIQUE TOTAL rifa_id,number)
-- bloqueaba recomprar un número cuya reserva anterior expiró/canceló.
-- Fix: eliminar constraint TOTAL + garantizar que el UNIQUE PARTIAL
--      (status IN ('reserved','paid') de 0003) sea la única regla activa.
-- Además rollback parcial rows corrupted del smoke B#21 cron.
-- =================================================================

-- 1) ELIMINAR EL CONSTRAINT UNIQUE TOTAL QUE BLOQUEA RECOMPRA.
ALTER TABLE IF EXISTS public.reservas
    DROP CONSTRAINT IF EXISTS reservas_unique_active_per_rifa;

-- 2) ASEGURAR QUE EXISTA EL UNIQUE PARTIAL QUE PERMITE RECOMPRAR EXPIRED.
--    (Creado ya en 0003 pero por si acaso no estaba en Cloud prod.)
DROP INDEX IF EXISTS public.reservas_one_active_per_rifa_number_idx;
CREATE UNIQUE INDEX IF NOT EXISTS reservas_one_active_per_rifa_number_idx
    ON public.reservas (rifa_id, number)
    WHERE status IN ('reserved','paid');

-- 3) ROLLBACK DATA CORRUPTED B#21 SMOKE: reservas que estaban PAID
--    y el cron pasó a status=expired por error (expires_at OLD).
--    Un row "paid corrupto" = status='expired' Y EXISTE un pago.approved
--    asociado por reserva_id O external_reference matches o bien el user
--    reservó + pagó anteriormente (reservas.created_at hace días).
UPDATE public.reservas r
   SET status       = 'paid',
       updated_at   = NOW()
 WHERE status = 'expired'
   AND EXISTS (
       SELECT 1
         FROM public.pagos p
        WHERE p.reserva_id = r.id
          AND p.status     = 'approved'
   );

-- 4) OPTIONAL sanity trigger check: trigger sync_rifa_available_numbers
--    ya se dispara x UPDATE y corrige available_numbers automáticamente.
--    No hay que tocarlo.
