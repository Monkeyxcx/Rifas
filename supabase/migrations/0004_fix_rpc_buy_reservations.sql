-- =================================================================
-- 0004_FIX_RPC_BUY_RESERVATIONS.SQL · RifasCenter
-- Fix Postgres ERROR structure of query does not match function
-- result type al retornar NULL sin tipo explicito en VARCHAR(4).
-- Retorna la tabla con columnas casteadas explícitamente.
-- =================================================================

CREATE OR REPLACE FUNCTION public.buy_reservations(
    p_rifa_id    UUID,
    p_user_id    UUID,
    p_numbers    VARCHAR(4)[]
)
RETURNS TABLE (success BOOLEAN, message TEXT, failed_number VARCHAR(4))
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status TEXT;
    v_total  INT;
    n VARCHAR(4);
    existing_status TEXT;
BEGIN
    SELECT status, total_numbers INTO v_status, v_total
      FROM public.rifas WHERE id = p_rifa_id
      FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Rifa no encontrada'::TEXT, NULL::VARCHAR(4);
        RETURN;
    END IF;
    IF v_status <> 'active' THEN
        RETURN QUERY SELECT false::BOOLEAN, 'Rifa no disponible para reservas'::TEXT, NULL::VARCHAR(4);
        RETURN;
    END IF;

    FOREACH n IN ARRAY p_numbers LOOP
        IF n ~ '^\d+$' AND (n::int < 0 OR n::int >= v_total) THEN
            RETURN QUERY SELECT false::BOOLEAN, 'Número fuera de rango permitido'::TEXT, n::VARCHAR(4);
            RETURN;
        END IF;

        SELECT status INTO existing_status
          FROM public.reservas
         WHERE rifa_id = p_rifa_id AND number = n
           AND status IN ('reserved','paid')
         LIMIT 1;

        IF existing_status IS NOT NULL THEN
            RETURN QUERY SELECT false::BOOLEAN, 'Número ya reservado o vendido'::TEXT, n::VARCHAR(4);
            RETURN;
        END IF;

        INSERT INTO public.reservas (rifa_id, user_id, number, status, expires_at)
        VALUES (p_rifa_id, p_user_id, n, 'reserved', NOW() + INTERVAL '15 minutes');
    END LOOP;

    RETURN QUERY SELECT true::BOOLEAN, 'Reservado correctamente'::TEXT, NULL::VARCHAR(4);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_reservations TO authenticated;
