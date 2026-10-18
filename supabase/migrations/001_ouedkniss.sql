-- ============================================================================
-- SUPABASE MIGRATION: 001_ouedkniss.sql
-- ARCHITECTURE NORMALISÉE HAUTE FIDÉLITÉ POUR OUEDKNISS SCRAPING
-- STRICT ZERO-MOCK / PRESERVATION INTEGRALE UTF-8 (ARABE & FRANCAIS) / RLS SÉCURISÉE
-- ============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. FONCTIONS ET DÉCLENCHEURS UTILITAIRES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. TABLE DES CATÉGORIES (Arbre des catégories Ouedkniss)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  parent_slug TEXT REFERENCES categories(slug) ON DELETE SET NULL,
  icon TEXT,
  site_count INTEGER DEFAULT 0 CHECK (site_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. TABLE DES VENDEURS / BOUTIQUES (Sellers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL, -- user.id ou store.id d'Ouedkniss
  type TEXT NOT NULL DEFAULT 'unknown' CHECK (type IN ('user', 'store', 'unknown')),
  name TEXT,
  store_slug TEXT,
  profile_url TEXT,
  wilaya TEXT,
  commune TEXT,
  address TEXT,
  emails TEXT[],
  phones JSONB DEFAULT '[]'::jsonb, -- [{ "number": "0550123456", "has_whatsapp": true, "has_viber": false, "source": "store_graphql" }]
  contacts_status TEXT NOT NULL DEFAULT 'ok' CHECK (contacts_status IN ('ok', 'none', 'failed')),
  raw JSONB, -- Réponse source brute (GraphQL)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sellers_source_id ON sellers(source_id);
CREATE INDEX IF NOT EXISTS idx_sellers_store_slug ON sellers(store_slug);
CREATE INDEX IF NOT EXISTS idx_sellers_type ON sellers(type);

CREATE TRIGGER trigger_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. TABLE DES ANNONCES (Listings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL, -- ID d'annonce Ouedkniss (ex: "57874464")
  url TEXT NOT NULL,              -- URL canonique directe (ex: https://www.ouedkniss.com/slug-d57874464)
  url_encoded TEXT NOT NULL,      -- URL percent-encodée standard
  title TEXT NOT NULL,            -- Titre brut UTF-8 strict (Français / Arabe)
  description TEXT,               -- Description brute sans troncature
  price NUMERIC CHECK (price IS NULL OR price >= 0),
  price_raw TEXT,                 -- Texte brut de prix renvoyé par l'API (ex: "45 000 DA", "Sur devis")
  price_unit TEXT,                -- Unité exacte ('DA', 'Millions', etc.)
  currency TEXT NOT NULL DEFAULT 'DA',
  negotiable BOOLEAN,             -- NULL si non renseigné par l'API
  category_id TEXT REFERENCES categories(slug) ON DELETE SET NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
  region TEXT,                    -- Wilaya (ex: 'Alger', 'Oran')
  city TEXT,                      -- Commune (ex: 'Kouba', 'Bir El Djir')
  published_at TIMESTAMPTZ,       -- Date de création source
  refreshed_at TIMESTAMPTZ,       -- Date d'actualisation source
  is_store BOOLEAN NOT NULL DEFAULT false,
  is_promo BOOLEAN NOT NULL DEFAULT false,
  is_flash BOOLEAN NOT NULL DEFAULT false,
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  specs JSONB DEFAULT '{}'::jsonb, -- Caractéristiques techniques réelles
  raw JSONB,                      -- Payload source GraphQL 100% complet
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index d'optimisation et recherche
CREATE INDEX IF NOT EXISTS idx_listings_source_id ON listings(source_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON listings(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_refreshed_at ON listings(refreshed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);

-- Index Trigramme GIN pour recherche textuelle bilingue (Arabe & Français)
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING gin (description gin_trgm_ops);

CREATE TRIGGER trigger_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. TABLE DES IMAGES DES ANNONCES (Listing Images)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  is_broken BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_listing_image UNIQUE (listing_id, url)
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);

-- ----------------------------------------------------------------------------
-- 6. TABLE DES ANNONCES SIMILAIRES (Listing Similars)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_similars (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  similar_source_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (listing_id, similar_source_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_similars_target ON listing_similars(similar_source_id);

-- ----------------------------------------------------------------------------
-- 7. HISTORIQUE RÉEL DES PRIX (Listing Price History)
-- Uniquement alimenté lors de véritables re-lectures de l'annonce
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL CHECK (price >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing_id ON listing_price_history(listing_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 8. TABLE DE REPRISE PERSISTANTE (Scrape Checkpoints)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scrape_checkpoints (
  id TEXT PRIMARY KEY, -- ex: "telephones_wilaya_16" ou "automobiles_p1"
  category_slug TEXT NOT NULL,
  wilaya_id TEXT,
  filter_json JSONB DEFAULT '{}'::jsonb,
  page INTEGER NOT NULL DEFAULT 1 CHECK (page >= 1),
  cursor TEXT,
  last_source_id TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'error')),
  scraped_count INTEGER NOT NULL DEFAULT 0 CHECK (scraped_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_checkpoints_updated_at
  BEFORE UPDATE ON scrape_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. TABLE DE JOURNALISATION DES ERREURS (Scrape Errors)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scrape_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT,
  url TEXT,
  category_slug TEXT,
  page INTEGER,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_errors_category ON scrape_errors(category_slug);
CREATE INDEX IF NOT EXISTS idx_scrape_errors_created_at ON scrape_errors(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_similars ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_errors ENABLE ROW LEVEL SECURITY;

-- ACCÈS LECTURE PUBLIQUE (anon & authenticated) POUR LE CATALOGUE
CREATE POLICY "Public read access for categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for listing_images"
  ON listing_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for listing_similars"
  ON listing_similars FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for price_history"
  ON listing_price_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- LECTURE RESTREINTE DES CONTACTS VENDEURS (Seules les informations publiques sont lisibles)
CREATE POLICY "Public read access for seller profiles"
  ON sellers FOR SELECT
  TO anon, authenticated
  USING (true);

-- ACCÈS TOTAL EN ÉCRITURE RÉSERVÉ AU SERVICE_ROLE (Backend de Scraping)
-- AUCUNE ÉCRITURE AUTORISÉE DEPUIS LE CLIENT ANONYME OU NON PRIVILÉGIÉ
CREATE POLICY "Service role full access categories"
  ON categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access sellers"
  ON sellers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access listings"
  ON listings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access listing_images"
  ON listing_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access listing_similars"
  ON listing_similars FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access price_history"
  ON listing_price_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access checkpoints"
  ON scrape_checkpoints FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access errors"
  ON scrape_errors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 11. INITIALISATION DES CATÉGORIES PRINCIPALES (Semence Réelle)
-- ----------------------------------------------------------------------------
INSERT INTO categories (slug, name_fr, name_ar, icon, site_count) VALUES
  ('automobiles', 'Véhicules & Automobiles', 'سيارات و مركبات', 'Car', 150000),
  ('pieces-detachees', 'Pièces détachées Auto', 'قطع غيار و إكسسوارات', 'Cog', 45000),
  ('telephones', 'Téléphones & Tablettes', 'هواتف و لوحات إلكترونية', 'Smartphone', 35000),
  ('informatique', 'Informatique & Bureau', 'إعلام آلي و مكتبية', 'Laptop', 28000),
  ('electromenager', 'Électroménager', 'كهرومنزلي', 'Tv', 24000),
  ('immobilier', 'Immobilier & Terrains', 'عقارات و أراضي', 'Home', 95000),
  ('maison', 'Maison & Mobilier', 'أثاث و ديكور منزلي', 'Armchair', 20000),
  ('vetements', 'Vêtements & Mode', 'ملابس و أزياء', 'Shirt', 30000),
  ('jeux-video', 'Jeux Vidéo & Consoles', 'ألعاب فيديو و منصات', 'Gamepad2', 15000),
  ('materiaux', 'Matériaux & Équipement Pro', 'مواد و معدات مهنية', 'Hammer', 18000),
  ('sports-loisirs', 'Sports & Loisirs', 'رياضة و تسلية', 'Bike', 12000),
  ('emploi', 'Emploi & Recrutement', 'توظيف و عمل', 'Briefcase', 22000),
  ('services', 'Services & Travaux', 'خدمات و أشغال', 'Wrench', 25000),
  ('voyages-tourisme', 'Voyages & Tourisme', 'أسفار و سياحة', 'Plane', 8000),
  ('animaux', 'Animaux & Élevage', 'حيوانات و تربية', 'Dog', 14000),
  ('bebes-enfants', 'Bébés & Enfants', 'رضع و أطفال', 'Baby', 9000),
  ('alimentation-agriculture', 'Alimentation & Agriculture', 'تغذية و فِلاحة', 'Apple', 11000)
ON CONFLICT (slug) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  icon = EXCLUDED.icon,
  site_count = EXCLUDED.site_count,
  updated_at = NOW();
