import type { Rifa, RifaStats } from "@/lib/types";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

export const MOCK_RIFAS: Array<{ rifa: Rifa; stats: RifaStats }> = [
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000001",
      creator_id: "creator-1",
      title: "iPhone 15 Pro Max 256GB — Edición Titanio",
      slug: "iphone-15-pro-max-256gb-titanio",
      description:
        "Gana el nuevo iPhone 15 Pro Max en color titanio natural. Envío gratis a todo LATAM.",
      prize_name: "iPhone 15 Pro Max 256GB Titanio",
      prize_image_url: null,
      prize_value: 6_200_000,
      is_solidarity: false,
      cause_name: null,
      cause_description: null,
      cause_target: 0,
      number_price: 18_000,
      total_numbers: 100,
      available_numbers: 43,
      status: "active",
      ends_at: new Date(NOW + 12 * DAY).toISOString(),
      draw_date: new Date(NOW + 13 * DAY).toISOString(),
      draw_instructions:
        "Sorteo vía transmisión en Instagram Live usando testigos + hash público.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 3 * DAY).toISOString(),
      updated_at: new Date(NOW - 2 * DAY).toISOString(),
      creator: {
        id: "creator-1",
        full_name: "TechStore LATAM",
        avatar_url: null,
        country: "Colombia"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000001",
      total_numbers: 100,
      available_numbers: 43,
      sold_numbers: 57,
      sold_percentage: 57,
      number_price: 18_000,
      status: "active",
      created_at: new Date(NOW - 3 * DAY).toISOString(),
      ends_at: new Date(NOW + 12 * DAY).toISOString(),
      draw_date: new Date(NOW + 13 * DAY).toISOString()
    }
  },
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000002",
      creator_id: "creator-2",
      title: "Fundación Unidos por los Niños — Lotería Navideña",
      slug: "fundacion-unidos-ninos-navideno",
      description:
        "Toda la recaudación se destina a juguetes y cenas navideñas para 320 niños de la Ciudad de México.",
      prize_name: "Bono de despensa $100.000 + Cena de Navidad familiar",
      prize_image_url: null,
      prize_value: 120_000,
      is_solidarity: true,
      cause_name: "Fundación Unidos por los Niños A.C.",
      cause_description:
        "100% del valor neto va a regalos navideños y despensas del programa #NiñezFeliz.",
      cause_target: 850_000,
      number_price: 5_000,
      total_numbers: 100,
      available_numbers: 18,
      status: "active",
      ends_at: new Date(NOW + 4 * DAY).toISOString(),
      draw_date: new Date(NOW + 5 * DAY).toISOString(),
      draw_instructions:
        "Sorteo con testigos de la fundación y en vivo por Facebook Live.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 7 * DAY).toISOString(),
      updated_at: new Date(NOW - 1 * DAY).toISOString(),
      creator: {
        id: "creator-2",
        full_name: "Fundación Unidos",
        avatar_url: null,
        country: "México"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000002",
      total_numbers: 100,
      available_numbers: 18,
      sold_numbers: 82,
      sold_percentage: 82,
      number_price: 5_000,
      status: "active",
      created_at: new Date(NOW - 7 * DAY).toISOString(),
      ends_at: new Date(NOW + 4 * DAY).toISOString(),
      draw_date: new Date(NOW + 5 * DAY).toISOString()
    }
  },
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000003",
      creator_id: "creator-3",
      title: "Moto Bajaj Pulsar NS200 — 0km 2026",
      slug: "moto-bajaj-pulsar-ns200-2026",
      description:
        "Rifa 20 años de la tienda MotorSport. 0 kilómetros, color azul sport, papeles al día.",
      prize_name: "Bajaj Pulsar NS200 FI ABS 2026 0km",
      prize_image_url: null,
      prize_value: 11_500_000,
      is_solidarity: false,
      cause_name: null,
      cause_description: null,
      cause_target: 0,
      number_price: 35_000,
      total_numbers: 100,
      available_numbers: 66,
      status: "active",
      ends_at: new Date(NOW + 30 * DAY).toISOString(),
      draw_date: new Date(NOW + 31 * DAY).toISOString(),
      draw_instructions:
        "Sorteo oficial con número legal. Entrega de moto con notario público.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 1 * DAY).toISOString(),
      updated_at: new Date(NOW - 1 * DAY).toISOString(),
      creator: {
        id: "creator-3",
        full_name: "MotorSport Store",
        avatar_url: null,
        country: "Argentina"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000003",
      total_numbers: 100,
      available_numbers: 66,
      sold_numbers: 34,
      sold_percentage: 34,
      number_price: 35_000,
      status: "active",
      created_at: new Date(NOW - 1 * DAY).toISOString(),
      ends_at: new Date(NOW + 30 * DAY).toISOString(),
      draw_date: new Date(NOW + 31 * DAY).toISOString()
    }
  },
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000004",
      creator_id: "creator-4",
      title: "Viaje All Inclusive 7 noches — Cancún, Riviera Maya",
      slug: "viaje-cancun-all-inclusive",
      description:
        "Para 2 personas en hotel 5 estrellas frente al mar. Vuelos incluidos desde CCS/Bog/CDMX/SCL.",
      prize_name: "Hotel Grand Oasis Cancún 7noches + Vuelos 2pax",
      prize_image_url: null,
      prize_value: 4_800_000,
      is_solidarity: false,
      cause_name: null,
      cause_description: null,
      cause_target: 0,
      number_price: 22_000,
      total_numbers: 100,
      available_numbers: 27,
      status: "active",
      ends_at: new Date(NOW + 9 * DAY).toISOString(),
      draw_date: new Date(NOW + 10 * DAY).toISOString(),
      draw_instructions:
        "Sorteo en vivo con 2 testigos sorteadores. Vence en 2027.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 4 * DAY).toISOString(),
      updated_at: new Date(NOW - 1 * DAY).toISOString(),
      creator: {
        id: "creator-4",
        full_name: "Viajazo Travel Club",
        avatar_url: null,
        country: "Venezuela"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000004",
      total_numbers: 100,
      available_numbers: 27,
      sold_numbers: 73,
      sold_percentage: 73,
      number_price: 22_000,
      status: "active",
      created_at: new Date(NOW - 4 * DAY).toISOString(),
      ends_at: new Date(NOW + 9 * DAY).toISOString(),
      draw_date: new Date(NOW + 10 * DAY).toISOString()
    }
  },
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000005",
      creator_id: "creator-5",
      title: "MacBook Pro M4 Pro 14\" 18GB — 1TB SSD",
      slug: "macbook-pro-m4-18gb-1tb",
      description:
        "Rifa por lanzamiento. Apple Silicon M4 Pro, 18GB unif., 1TB SSD, Space Black. Sellado con garantía.",
      prize_name: "MacBook Pro M4 Pro 14\" 18GB / 1TB",
      prize_image_url: null,
      prize_value: 9_800_000,
      is_solidarity: false,
      cause_name: null,
      cause_description: null,
      cause_target: 0,
      number_price: 49_000,
      total_numbers: 50,
      available_numbers: 39,
      status: "active",
      ends_at: new Date(NOW + 20 * DAY).toISOString(),
      draw_date: new Date(NOW + 21 * DAY).toISOString(),
      draw_instructions: "Sorteo vía sorteador público con hash en cadena.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 2 * DAY).toISOString(),
      updated_at: new Date(NOW - 2 * DAY).toISOString(),
      creator: {
        id: "creator-5",
        full_name: "GeekHub Store",
        avatar_url: null,
        country: "Chile"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000005",
      total_numbers: 50,
      available_numbers: 39,
      sold_numbers: 11,
      sold_percentage: 22,
      number_price: 49_000,
      status: "active",
      created_at: new Date(NOW - 2 * DAY).toISOString(),
      ends_at: new Date(NOW + 20 * DAY).toISOString(),
      draw_date: new Date(NOW + 21 * DAY).toISOString()
    }
  },
  {
    rifa: {
      id: "00000000-0000-0000-0000-000000000006",
      creator_id: "creator-6",
      title: "Rifa Solidaria por las víctimas del altiplano — Techo para Todos",
      slug: "solidaria-altiplano-techo-para-todos",
      description:
        "Con tu número compras materiales para techos y kit calefacción para 12 familias de Puno.",
      prize_name: "Kit electrohogar Completo + TV 55\" 4K",
      prize_image_url: null,
      prize_value: 280_000,
      is_solidarity: true,
      cause_name: "Techo Para Todos ONG",
      cause_description:
        "Nos encargamos directamente de comprar la mercadería y entregarla con los vecinos. Fotos publicadas.",
      cause_target: 420_000,
      number_price: 10_000,
      total_numbers: 100,
      available_numbers: 4,
      status: "active",
      ends_at: new Date(NOW + 2 * DAY).toISOString(),
      draw_date: new Date(NOW + 3 * DAY).toISOString(),
      draw_instructions: "Transmisión en TikTok Live + 3 testigos.",
      banner_ad_config: null,
      metadata: null,
      created_at: new Date(NOW - 10 * DAY).toISOString(),
      updated_at: new Date(NOW - 0.5 * DAY).toISOString(),
      creator: {
        id: "creator-6",
        full_name: "ONG Techo Para Todos",
        avatar_url: null,
        country: "Perú"
      }
    },
    stats: {
      rifa_id: "00000000-0000-0000-0000-000000000006",
      total_numbers: 100,
      available_numbers: 4,
      sold_numbers: 96,
      sold_percentage: 96,
      number_price: 10_000,
      status: "active",
      created_at: new Date(NOW - 10 * DAY).toISOString(),
      ends_at: new Date(NOW + 2 * DAY).toISOString(),
      draw_date: new Date(NOW + 3 * DAY).toISOString()
    }
  }
];
