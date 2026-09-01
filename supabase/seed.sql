-- =================================================================
-- SEED.SQL · RifasCenter
-- Datos de demo para entorno local. SOLO para desarrollo.
-- =================================================================
-- IMPORTANTE: en un proyecto real, los usuarios se crean por
-- Supabase Auth (OAuth o email). Este seed asume que insertaste
-- los IDs manualmente o creaste accounts test en local.
-- =================================================================

-- --------------------
-- USERS de prueba (auth.users)
-- NOTA: La tabla auth.users es manejada internamente por Supabase.
-- Si usas `supabase start` puedes crear usuarios con:
--   curl 'http://127.0.0.1:54321/auth/v1/signup' -H "apikey: ANON_KEY" \
--     -d '{"email":"creador@test.com","password":"Prueba123*"}'
-- --------------------

-- Placeholder UUIDs (coincidir con los que crees en auth.users)
\set creador_id   '11111111-1111-1111-1111-111111111111'
\set usuario1_id  '22222222-2222-2222-2222-222222222222'
\set usuario2_id  '33333333-3333-3333-3333-333333333333'

-- --------------------
-- Profiles
-- --------------------
INSERT INTO public.profiles (id, full_name, avatar_url, phone, country, bio, is_verified)
VALUES
  (:'creador_id',  'Laura Creadora',  NULL, '+573001112233', 'CO', 'Crea rifas para recaudar fondos a escuelas locales.', TRUE),
  (:'usuario1_id', 'Juan Participa',  NULL, '+573004445566', 'CO', NULL, FALSE),
  (:'usuario2_id', 'María Solidaria', NULL, '+573007778899', 'CO', 'Apoyo causas sociales siempre que puedo.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- --------------------
-- RIFAS demo (2 activas comerciales + 1 solidaria)
-- --------------------
INSERT INTO public.rifas
  (id, creator_id, title, slug, description, prize_name, prize_image_url, prize_value,
   is_solidarity, cause_name, cause_description,
   number_price, total_numbers, available_numbers, status, ends_at, draw_date)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    :'creador_id',
    'iPhone 16 Pro 256GB + AirPods Pro 2',
    'iphone-16-pro',
    'Rifa de lanzamiento de la nueva generación iPhone 16 Pro con bundle AirPods Pro 2 originales sellados de fábrica. Números del 00 al 99. Sorteo al 100% de venta o 30 de noviembre del 2026, lo que ocurra primero.',
    'iPhone 16 Pro 256GB Titanio Desierto + AirPods Pro 2',
    NULL, 5900000,
    FALSE, NULL, NULL,
    99000, 100, 73, 'active',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '31 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    :'creador_id',
    'Bicicleta Trek Marlin 7 — Talla M',
    'bicicleta-trek-marlin-7',
    'Bicicleta de montaña 2025, ideal para senderos y ciudad. Rifa low cost para probar suerte. Total 50 números.',
    'Trek Marlin 7, cuadro aluminio, frenos hidráulicos',
    NULL, 1800000,
    FALSE, NULL, NULL,
    45000, 50, 12, 'active',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '22 days'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    :'creador_id',
    '🎗️ Merienda Caliente para Escuela Rural El Porvenir',
    'escuela-el-porvenir-meriendas',
    'Esta rifa solidaria recauda fondos para dar 2 meriendas calientes por día a 80 niñ@s de la Escuela Rural El Porvenir (Córdoba, CO). Cada número que compras = 1 semana de meriendas para 1 niño.',
    'Noche de Cine 4K en Casa + 1 año Netflix',
    NULL, 850000,
    TRUE,
    'Fundación Manos que Ayudan',
    'Comedor comunitario para 80 niñ@s de escasos recursos en zona rural. Meta: 12 millones de pesos COP por 6 meses de alimentación.',
    30000, 100, 41, 'active',
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '46 days'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------
-- RESERVAS demo de números vendidos
-- --------------------
INSERT INTO public.reservas (rifa_id, user_id, number, status, expires_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'usuario1_id', '05', 'paid', NOW() + INTERVAL '1 year'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'usuario1_id', '12', 'paid', NOW() + INTERVAL '1 year'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'usuario2_id', '07', 'paid', NOW() + INTERVAL '1 year'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'usuario2_id', '33', 'paid', NOW() + INTERVAL '1 year'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', :'usuario1_id', '99', 'paid', NOW() + INTERVAL '1 year')
ON CONFLICT DO NOTHING;
