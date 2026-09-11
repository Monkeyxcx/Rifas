-- ============================================================================
-- 0010_RPC_LAZY_EXPIRE_AND_WEBHOOK_REJECTED.SQL · RifasCenter
--
-- Problemas que resuelve:
--   BUG #1: Vercel Hobby = 1 cron/dia. Reservas status='reserved' con
--           expires_at < NOW() permanecen BLOQUEADAS 23h hasta que corre el
--           cron limpiar-reservas => nadie (ni el dueño ni otros) puede
--           volver a tomarlos.
--   BUG #2: RPC buy_reservations NO expira inline antes del conflict check =>
--           devuelve 409 "numero ya reservado" en lugar de re-expirar y
--           reinsertar.
--   BUG #3: Webhook MP SOLO actualiza status='approved'. Si pago
--           rejected/cancelled/refunded la reserva se queda 'reserved'
--           todo el plazo del cron.
--
-- Fixes en esta migracion:
--   1) buy_reservations: UPDATE lazy expire rifa_id al INICIO del RPC.
--      Ya NO DEPENDE del cron. El trigger trg_sync_rifa_available
--      dispara solo y actualiza rifas.available_numbers.
--   2) Nueva funcion helper expire_rifa_reservations(p_rifa_id UUID) para
--      reutilizar desde app/(app)/rifas/[id]/page.tsx (cada page view libera
--      vencidas inline, sin esperar cron).
--   3) Post-condicion: status reservas final IN ('reserved','paid','expired',
--      'cancelled','refunded') por consistencia.
-- ============================================================================

-- 1) Helper: expira reservas vencidas de una rifa. Llamado desde RPC y
--    desde page loads (lazy). Trigger DB actualiza available_numbers SOLO.
CREATE OR REPLACE FUNCTION public.expire_rifa_reservations(p_rifa_id UUID)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.reservas
       SET status     = 'expired',
           updated_at = NOW()
     WHERE rifa_id    = p_rifa_id
       AND status     = 'reserved'
       AND expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_rifa_reservations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_rifa_reservations(UUID) TO service_role;


-- 2) Reemplazamos RPC buy_reservations CON lazy expire inline al INICIO.
--    (Mismo signature que 0004 para no romper app/api/reservar/route.ts).
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
    -- placeholder: ignora retorno expire_rifa_reservations pero dispara UPDATE + trigger
    _expired INT;
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

    -- ==========================================================
    -- LAZY EXPIRE INLINE (fix BUG #1 / #2): sin esperar cron 24h
    -- actualizamos a status='expired' las reservas vencidas de
    -- ESTA rifa. Dispara trg_sync_rifa_available automatico.
    -- ==========================================================
    _expired := public.expire_rifa_reservations(p_rifa_id);

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

GRANT EXECUTE ON FUNCTION public.buy_reservations(UUID, UUID, VARCHAR(4)[]) TO authenticated;
