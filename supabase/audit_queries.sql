-- =====================================================================
-- CyberScrape — Requêtes d'audit interactives (SQL Editor Supabase)
-- =====================================================================

-- 1) Combien de lignes réelles vs suspectes ?
select
  count(*)                                                                 as total,
  count(*) filter (where id ~ '^prod_ouedkniss_[0-9]+$')                   as ids_conformes_api,
  count(*) filter (where id !~ '^prod_ouedkniss_[0-9]+$')                  as ids_suspects,
  count(*) filter (where image_url ilike '%images.unsplash.com%')          as images_unsplash
from public.scraped_products;

-- 2) Contrôles de propreté après migration :
select
  count(*) filter (where rating is not null)          as notes_restantes,
  count(*) filter (where seller_phone is not null)     as avec_telephone,
  count(*) filter (where seller_email is not null)     as avec_email
from public.scraped_products;
