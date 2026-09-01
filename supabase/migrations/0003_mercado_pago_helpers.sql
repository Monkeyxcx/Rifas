-- =================================================================
-- 0003_MERCADOPAGO_HELPERS.SQL · RifasCenter
-- Unique partial index para evitar doble venta,
-- trigger actualiza available_numbers + stats view, seed inicial.
-- =================================================================

-- --------------------
-- UNIQUE PARTIAL INDEX
-- Garantiza a nivel BD que un número (rifa_id, number) SOLO puede
-- existir UNA VEZ con status reserved/paid.
-- Más fuerte que el constraint UNIQUE normal porque ignora cancelled/expired.
-- --------------------
DROP INDEX IF EXISTS reservas_one_active_per_rifa_number_idx;
CREATE UNIQUE INDEX reservas_one_active_per_rifa_number_idx
    ON public.reservas (rifa_id, number)
    WHERE status IN ('reserved','paid');

-- --------------------
-- TRIGGER: decrementar available_numbers al CREAR reserva reserved
--          incrementar al pasar a cancelled/expired/refunded.
-- Automaticamente mantiene consistencia.
-- --------------------
CREATE OR REPLACE FUNCTION public.sync_rifa_available_numbers()
RETURNS TRIGGER AS $$
DECLARE
    v_rifa_id UUID;
    v_delta INT;
BEGIN
    -- CASE flujo de status -> delta de available
    -- available decreases por cada reserved o paid (finalizado)
    -- available increases por cada salida de ese status
    IF (TG_OP = 'INSERT') THEN
        v_rifa_id := NEW.rifa_id;
        IF NEW.status IN ('reserved','paid') THEN v_delta := -1; ELSE v_delta := 0; END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_rifa_id := NEW.rifa_id;
        v_delta :=
            (CASE WHEN OLD.status IN ('reserved','paid') THEN 1 ELSE 0 END) -
            (CASE WHEN NEW.status IN ('reserved','paid') THEN 1 ELSE 0 END);
    ELSIF (TG_OP = 'DELETE') THEN
        v_rifa_id := OLD.rifa_id;
        IF OLD.status IN ('reserved','paid') THEN v_delta := +1; ELSE v_delta := 0; END IF;
    END IF;

    IF v_delta <> 0 AND v_rifa_id IS NOT NULL THEN
        UPDATE public.rifas
           SET available_numbers = GREATEST(0, available_numbers + v_delta)
         WHERE id = v_rifa_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_rifa_available ON public.reservas;
CREATE TRIGGER sync_rifa_available
    AFTER INSERT OR UPDATE OR DELETE ON public.reservas
    FOR EACH ROW EXECUTE FUNCTION public.sync_rifa_available_numbers();

-- --------------------
-- TRIGGER: al cerrar rifa 100% -> auto status closed
-- --------------------
CREATE OR REPLACE FUNCTION public.auto_close_rifa_when_sold_out()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.available_numbers = 0 AND NEW.status = 'active') THEN
        NEW.status := 'closed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_close_sold_out ON public.rifas;
CREATE TRIGGER auto_close_sold_out
    BEFORE UPDATE OF available_numbers ON public.rifas
    FOR EACH ROW EXECUTE FUNCTION public.auto_close_rifa_when_sold_out();

-- --------------------
-- FUNCTION: reservar_numeros (RPC atomico)
-- Llamado desde la route handler /api/reservar dentro de transaction.
-- Evita race conditions.
-- --------------------
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
    -- 1) Validar rifa
    SELECT status, total_numbers INTO v_status, v_total
      FROM public.rifas WHERE id = p_rifa_id
      FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Rifa no encontrada', NULL; RETURN;
    END IF;
    IF v_status <> 'active' THEN
        RETURN QUERY SELECT false, 'Rifa no disponible para reservas', NULL; RETURN;
    END IF;

    -- 2) Iterar números
    FOREACH n IN ARRAY p_numbers LOOP
        -- Validar rango según total_numbers
        IF n ~ '^\d+$' AND (n::int < 0 OR n::int >= v_total) THEN
            RETURN QUERY SELECT false, 'Número fuera de rango permitido', n; RETURN;
        END IF;

        -- Checkear existencia ACTIVA. Usamos partial index que ya garantiza unicidad
        -- pero damos error amigable.
        SELECT status INTO existing_status
          FROM public.reservas
         WHERE rifa_id = p_rifa_id AND number = n
           AND status IN ('reserved','paid')
         LIMIT 1;

        IF existing_status IS NOT NULL THEN
            RETURN QUERY SELECT false, 'Número ya reservado o vendido', n; RETURN;
        END IF;

        -- OK -> insert
        INSERT INTO public.reservas (rifa_id, user_id, number, status, expires_at)
        VALUES (p_rifa_id, p_user_id, n, 'reserved', NOW() + INTERVAL '15 minutes');
    END LOOP;

    RETURN QUERY SELECT true, 'Reservado correctamente', NULL;
END;
$$;

-- --------------------
-- REVOKE / GRANT: acceso publico a rifa_stats
-- --------------------
GRANT SELECT ON public.rifa_stats             TO anon, authenticated;
GRANT SELECT ON public.profiles               TO anon, authenticated;
GRANT SELECT ON public.rifas                  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas  TO authenticated;
GRANT SELECT ON public.pagos                  TO authenticated;
GRANT SELECT ON public.ganadores              TO anon, authenticated;
GRANT SELECT, UPDATE ON public.notifications  TO authenticated;

GRANT EXECUTE ON FUNCTION public.buy_reservations TO authenticated;
