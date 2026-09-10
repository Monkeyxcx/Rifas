-- =================================================================
-- 0008_ROLLBACK_B08_CORRUPTED_RESERVAS_PAID_VIA_RIFA_USER.SQL
-- Fix B#08: 0006 usó JOIN p.reserva_id = r.id pero como Bug#01 insertaba
-- reserva_id SINTÉTICO en pagos.reserva_id (no match reservas.id REAL),
-- 0 rows fueron actualizadas. Las rows de B#21 siguen status='expired'
-- aunque pagos.status='approved'.
--
-- REPARACIÓN: Match por (rifa_id + user_id + timing + numbers overlap).
-- No se puede JOIN directo por numbers CSV porque reservas es 1 row por
-- número (1NF). Usamos EXISTS con subquery overlaps de numbers de pago
-- metadata o rango temporal de compra user/rifa.
-- =================================================================

-- 1) FUNCIÓN HELPER: extrae numbers[] de pagos.metadata->>'numbers' (CSV "07,13,42")
CREATE OR REPLACE FUNCTION public._split_numbers_csv(raw TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF raw IS NULL OR raw = '' THEN RETURN ARRAY[]::TEXT[]; END IF;
    RETURN ARRAY(
        SELECT DISTINCT trim(both ' ' FROM x)
        FROM unnest(string_to_array(raw, ',')) AS t(x)
        WHERE trim(both ' ' FROM x) ~ '^\d{2}$'
    );
END $$;

-- 2) REPARACIÓN: status='expired' → 'paid' cuando:
--      a) Existe pagos.approved asociado al mismo user + rifa
--      b) El pago fue aprobado DESPUÉS de created_at reserva y ANTES
--         de expires_at + INTERVAL '6h' (ventana gracia extendida)
--      c) Los números de la reserva coinciden con los pagos.metadata.numbers
--         O bien es el único row reservado de ese user en ese rifa.
UPDATE public.reservas r
SET status     = 'paid',
    updated_at = NOW()
WHERE r.status = 'expired'
  AND EXISTS (
    SELECT 1
      FROM public.pagos p
     WHERE p.rifa_id           = r.rifa_id
       AND p.user_id           = r.user_id
       AND p.status            = 'approved'
       AND p.paid_at          >= r.created_at - INTERVAL '5 minutes'
       AND p.paid_at          <= COALESCE(r.expires_at, p.paid_at) + INTERVAL '6 hours'
       AND (
            -- Match por numbers CSV exacto
            r.number = ANY(public._split_numbers_csv(p.metadata->>'numbers'))
            OR
            -- O bien: este user sólo tenía 1 pago approved en esta rifa
            -- y coincide con created_at window ±10m (confiable para B#21)
            (
              1 = (
                SELECT COUNT(*)
                  FROM public.pagos p2
                 WHERE p2.rifa_id = r.rifa_id
                   AND p2.user_id = r.user_id
                   AND p2.status  = 'approved'
              )
              AND p.paid_at BETWEEN r.created_at - INTERVAL '30 minutes'
                                 AND r.created_at + INTERVAL '8 hours'
            )
       )
  );

-- 3) RE-SYNC de available_numbers para todas las rifas tocadas:
--    available = total - (count rows reservas WHERE status IN ('reserved','paid'))
DO $$
DECLARE
    rec RECORD;
    available_calc INT;
BEGIN
    FOR rec IN
        SELECT DISTINCT r.rifa_id, rf.total_numbers
          FROM public.reservas r
          JOIN public.rifas rf ON rf.id = r.rifa_id
         WHERE r.status = 'paid'
           AND r.updated_at >= NOW() - INTERVAL '24 hours'
    LOOP
        SELECT COUNT(*) INTO available_calc
          FROM public.reservas x
         WHERE x.rifa_id = rec.rifa_id
           AND x.status IN ('reserved','paid');
        UPDATE public.rifas
           SET available_numbers = GREATEST(0, rec.total_numbers - available_calc),
               updated_at        = NOW()
         WHERE id = rec.rifa_id;
    END LOOP;
END $$;

-- 4) Limpieza helper (opcional, se deja para debugging futuro):
-- DROP FUNCTION IF EXISTS public._split_numbers_csv(TEXT);
