-- =====================================================================
-- CyberScrape — 001 : sécurité RLS + audit/assainissement des données
-- À exécuter dans le SQL Editor Supabase APRÈS sauvegarde (voir étape 0).
-- Adapter "scraped_products" si tableName est différent.
-- =====================================================================

-- 0) SAUVEGARDE (obligatoire)
create table if not exists public.scraped_products_backup_20261018 as table public.scraped_products;

-- 1) SÉCURITÉ : fermer l'écriture publique. L'écriture passe par le serveur (service_role, /api/supabase/sync).
alter table public.scraped_products enable row level security;
drop policy if exists "Allow public insert and update" on public.scraped_products;
drop policy if exists "Allow public read access" on public.scraped_products;
create policy "Allow public read access" on public.scraped_products for select to anon, authenticated using (true);

-- 2) AUDIT : combien de lignes viennent du générateur d'annonces fictives ?
--    Vraies annonces (serveur GraphQL) : id = prod_ouedkniss_<chiffres> et images sur cdn*.ouedkniss.com.
select
  count(*)                                                                 as total,
  count(*) filter (where id ~ '^prod_ouedkniss_[0-9]+$')                   as ids_conformes_api,
  count(*) filter (where id !~ '^prod_ouedkniss_[0-9]+$')                  as ids_suspects,
  count(*) filter (where image_url ilike '%images.unsplash.com%')          as images_unsplash,
  count(*) filter (where product_url ~ '/(automobiles|telephones|informatique|electromenager|immobilier|maison-meubles|vetements-mode|jeux-video|emploi|services|materiaux|sports-loisirs|pieces-detachees|voyages-tourisme|animaux|bebes-enfants|alimentation-agriculture)/[^/]+-d3[0-9]{7}$') as urls_generees
from public.scraped_products;

-- 3) QUARANTAINE des lignes fictives (copie, puis suppression à valider vous-même)
create table if not exists public.scraped_products_quarantine as
  select * from public.scraped_products
  where id !~ '^prod_ouedkniss_[0-9]+$' or image_url ilike '%images.unsplash.com%';

-- Décommenter après vérification du contenu de la quarantaine :
-- delete from public.scraped_products
--  where id !~ '^prod_ouedkniss_[0-9]+$' or image_url ilike '%images.unsplash.com%';

-- 4) Retirer les champs fabriqués des lignes restantes (anciennes valeurs par défaut du scraper)
update public.scraped_products set
  rating = null,
  reviews_count = null,
  ai_confidence = null,
  matrix_hash = null,
  price_history = '[]'::jsonb,
  original_price = current_price,
  discount_percent = 0,
  price_type = null,
  delivery_available = null,
  seller = case when seller is null then null
                else (seller - 'rating' - 'reviewsCount' - 'responseTime' - 'memberSince' - 'verified'
                      - case when seller->>'avatarUrl' ilike '%dicebear%' then 'avatarUrl' else '__none__' end) end,
  specs = (coalesce(specs, '{}'::jsonb) - '_seller' - '_priceType' - '_deliveryAvailable' - '_isSponsored')
where id ~ '^prod_ouedkniss_[0-9]+$';

-- 5) Contrôles de non-régression (doivent renvoyer 0 / valeurs réelles)
select count(*) filter (where rating is not null)          as notes_restantes,
       count(*) filter (where seller_phone is not null)     as avec_telephone,
       count(*) filter (where seller_email is not null)     as avec_email
from public.scraped_products;
