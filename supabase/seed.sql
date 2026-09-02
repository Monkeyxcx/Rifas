-- =================================================================
-- SEED.SQL · RifasCenter (SUPABASE CLOUD VERSION)
-- Datos demo para project_ref: pscnuvibkrkqqeppmckd
-- USO: 1) Crea 3 usuarios email/password EN Supabase Dashboard:
--         creador@test.com   / Prueba123*
--         participante@test.com / Prueba123*
--         solidario@test.com    / Prueba123*
--      2) Copia sus IDs (auth.users.id) en las 3 variables UUID abajo.
--      3) Aplica migration seed.sql
-- =================================================================

-- ⚠️ REEMPLAZA ESTOS 3 UUIDS con los auth.users.id REALES de tu proyecto!
--    Los puedes ver en Supabase Dashboard → Authentication → Users → Copy ID.
DO $$
DECLARE
    v_creador_id    UUID := '00000000-0000-0000-0000-000000000000';
    v_usuario1_id   UUID := '00000000-0000-0000-0000-000000000000';
    v_usuario2_id   UUID := '00000000-0000-0000-0000-000000000000';
    v_count INT;
BEGIN
    -- ==============================================================
    -- CHECK: ¿Se reemplazaron los UUID placeholders?
    -- ==============================================================
    IF (v_creador_id = '00000000-0000-0000-0000-000000000000') THEN
        RAISE NOTICE '⚠️  Seed saltado: debes reemplazar los 3 UUID placeholders con los IDs reales de auth.users.';
        RAISE NOTICE '     Cómo: Dashboard → Authentication → Users → Copy ID';
        RETURN;
    END IF;

    -- ==============================================================
    -- PROFILES (extensión auth.users)
    -- ==============================================================
    INSERT INTO public.profiles (id, full_name, avatar_url, phone, country, bio, is_verified)
    VALUES
      (v_creador_id,   'Laura Creadora',    NULL, '+573001112233', 'CO', 'Crea rifas para recaudar fondos a escuelas locales.', TRUE),
      (v_usuario1_id,  'Juan Participa',    NULL, '+573004445566', 'CO', NULL, FALSE),
      (v_usuario2_id,  'María Solidaria',   NULL, '+573007778899', 'CO', 'Apoyo causas sociales siempre que puedo.', TRUE)
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Profiles insertados: %', v_count;

    -- ==============================================================
    -- RIFAS (2 activas comerciales + 1 solidaria)
    -- ==============================================================
    INSERT INTO public.rifas
      (id, creator_id, title, slug, description, prize_name, prize_image_url, prize_value,
       is_solidarity, cause_name, cause_description,
       number_price, total_numbers, available_numbers, status, ends_at, draw_date)
    VALUES
      (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        v_creador_id,
        'iPhone 16 Pro 256GB + AirPods Pro 2',
        'iphone-16-pro',
        'Rifa de lanzamiento iPhone 16 Pro bundle AirPods Pro 2. Números 00 al 99. Sorteo 100% venta o 30 Nov 2026.',
        'iPhone 16 Pro 256GB Titanio Desierto + AirPods Pro 2',
        NULL, 5900000,
        FALSE, NULL, NULL,
        99000, 100, 73, 'active',
        NOW() + INTERVAL '30 days',
        NOW() + INTERVAL '31 days'
      ),
      (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        v_creador_id,
        'Bicicleta Trek Marlin 7 — Talla M',
        'bicicleta-trek-marlin-7',
        'Bicicleta montaña 2025 senderos + ciudad. Rifa low cost. Total 50 números.',
        'Trek Marlin 7, cuadro aluminio, frenos hidráulicos',
        NULL, 1800000,
        FALSE, NULL, NULL,
        45000, 50, 12, 'active',
        NOW() + INTERVAL '21 days',
        NOW() + INTERVAL '22 days'
      ),
      (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        v_creador_id,
        '🎗️ Merienda Caliente para Escuela Rural El Porvenir',
        'escuela-el-porvenir-meriendas',
        'Rifa solidaria: 2 meriendas/día para 80 niñ@s. Cada número = 1 semana de meriendas para 1 niño.',
        'Noche de Cine 4K en Casa + 1 año Netflix',
        NULL, 850000,
        TRUE,
        'Fundación Manos que Ayudan',
        'Comedor comunitario 80 niñ@s zona rural Córdoba CO. Meta 12M COP 6 meses alimentación.',
        30000, 100, 41, 'active',
        NOW() + INTERVAL '45 days',
        NOW() + INTERVAL '46 days'
      )
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Rifas insertadas: %', v_count;

    -- ==============================================================
    -- RESERVAS pagadas (5 demo)
    -- ==============================================================
    INSERT INTO public.reservas (rifa_id, user_id, number, status, expires_at) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_usuario1_id, '05', 'paid', NOW() + INTERVAL '1 year'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_usuario1_id, '12', 'paid', NOW() + INTERVAL '1 year'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_usuario2_id, '07', 'paid', NOW() + INTERVAL '1 year'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_usuario2_id, '33', 'paid', NOW() + INTERVAL '1 year'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_usuario1_id, '99', 'paid', NOW() + INTERVAL '1 year')
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Reservas insertadas: %', v_count;

    RAISE NOTICE '🎉 Seed RifasCenter cloud completado!';
END $$;
