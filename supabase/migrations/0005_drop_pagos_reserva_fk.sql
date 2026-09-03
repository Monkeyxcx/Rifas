-- =================================================================
-- 0005_DROP_PAGOS_RESERVA_FK.SQL · RifasCenter
-- Background: /api/reservar genera reserva_id UUID unilaterlamente
-- PERO no inserta en reservas.id: RPC buy_reservations inserta N rows
-- (1 x número) cada uno con su propio id PK. El fake reserva_id NO
-- existe como PK en reservas table → FK constraint pagos.reserva_id
-- → reservas.id SUSPENDE cualquier INSERT de pagos por violación.
--
-- Solución (NO REDESIGN COSTOSO): DROP FK pagos_reserva_id_fkey.
-- pagos.reserva_id queda como simple string reference/opcional, sin
-- integridad referencial estricta. Identidad pagada se resuelve en
-- webhook 4d con UPDATE reservas WHERE rifa_id=X AND number IN (...).
-- =================================================================

ALTER TABLE IF EXISTS public.pagos
  DROP CONSTRAINT IF EXISTS pagos_reserva_id_fkey;
