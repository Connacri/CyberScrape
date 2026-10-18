-- =====================================================================
-- CyberScrape — Sécurité RLS + Nettoyage des données résiduelles
-- =====================================================================

-- 0) Sauvegarde de précaution si la table existe
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'scraped_products') then
    create table if not exists public.scraped_products_backup_20261018 as
      select * from public.scraped_products;
  end if;
end $$;

-- 1) Sécurité RLS : lecture publique, écriture réservée au service_role (serveur Express)
alter table if exists public.scraped_products enable row level security;
drop policy if exists "Allow public insert and update" on public.scraped_products;
drop policy if exists "Allow public read access" on public.scraped_products;

create policy "Allow public read access"
  on public.scraped_products
  for select
  to anon, authenticated
  using (true);

-- 2) Quarantaine des annonces synthétiques / non-conformes
create table if not exists public.scraped_products_quarantine as
  select * from public.scraped_products
  where id !~ '^prod_ouedkniss_[0-9]+$' or image_url ilike '%images.unsplash.com%';

-- 3) Retirer les valeurs fictives des annonces réelles restantes
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
  seller = case
    when seller is null then null
    else (seller - 'rating' - 'reviewsCount' - 'responseTime' - 'memberSince' - 'verified'
          - case when seller->>'avatarUrl' ilike '%dicebear%' then 'avatarUrl' else '__none__' end)
  end,
  specs = (coalesce(specs, '{}'::jsonb) - '_seller' - '_priceType' - '_deliveryAvailable' - '_isSponsored')
where id ~ '^prod_ouedkniss_[0-9]+$';
