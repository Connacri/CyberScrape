#!/usr/bin/env node
/**
 * CYBER-VACUUM // Worker Crawler Ultra-Rapide (Node.js / TypeScript)
 * =================================================================
 * Architecture à concurrence agressive avec `fetch` natif et `AbortController`
 * individuel par requête pour empêcher tout gel de connexion.
 *
 * Exécution :
 *   npx tsx scripts/fast_crawler_worker.ts --category telephones --pages 10 --workers 8
 */

import fs from 'fs';
import path from 'path';

const GRAPHQL_ENDPOINT = 'https://api.ouedkniss.com/graphql';

const BROWSER_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Origin': 'https://www.ouedkniss.com',
  'Referer': 'https://www.ouedkniss.com/',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
};

const SEARCH_QUERY = `
query Search($q: String, $filter: SearchFilterInput) {
  search(q: $q, filter: $filter) {
    announcements {
      data {
        id
        title
        slug
        description
        refreshedAt
        createdAt
        isFromStore
        price
        pricePreview
        phones { phone hasWhatsapp hasViber }
        defaultMedia { mediaUrl }
        medias { mediaUrl }
        cities { id name region { id name } }
        specs { specification { codename label } valueText }
        user { id username phones { phone hasWhatsapp hasViber } }
        store { id name slug imageUrl description url }
      }
      paginatorInfo {
        lastPage
        hasMorePages
        total
        perPage
      }
    }
  }
}
`;

interface ScrapedItem {
  id: string;
  title: string;
  price_da: number;
  category: string;
  wilaya: string;
  phone: string;
  whatsapp: string;
  is_store: boolean;
  store_name: string;
  url: string;
  image_url: string;
  published_at: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPageWithAbort(
  categorySlug: string,
  page: number,
  count = 60,
  keywords = '',
  timeoutMs = 12000,
  maxRetries = 3
): Promise<{ success: boolean; items: any[]; total?: number; lastPage?: number; error?: string }> {
  const variables: Record<string, unknown> = {
    q: keywords || '',
    filter: {
      page,
      count,
    },
  };

  if (categorySlug && categorySlug !== 'all' && categorySlug !== 's') {
    (variables.filter as Record<string, unknown>).categorySlug = categorySlug;
  }

  const payload = JSON.stringify({ query: SEARCH_QUERY, variables });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: BROWSER_HEADERS,
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as any;
        if (json?.errors?.length && !json?.data?.search) {
          const msgs = json.errors.map((e: any) => e.message).join('; ');
          return { success: false, items: [], error: `GraphQL: ${msgs}` };
        }
        const ann = json?.data?.search?.announcements || {};
        const dataList = ann.data || [];
        const pag = ann.paginatorInfo || {};
        return {
          success: true,
          items: dataList,
          total: pag.total,
          lastPage: pag.lastPage,
        };
      }

      if (res.status === 400 || res.status === 404) {
        return { success: false, items: [], error: `HTTP ${res.status}` };
      }
    } catch (err) {
      clearTimeout(timer);
      const isAbort = (err as Error)?.name === 'AbortError';
      if (attempt === maxRetries) {
        return {
          success: false,
          items: [],
          error: isAbort ? `Délai dépassé (${timeoutMs}ms)` : (err as Error)?.message || String(err),
        };
      }
    }

    await sleep(400 * 2 ** (attempt - 1));
  }

  return { success: false, items: [], error: 'Échec après plusieurs tentatives' };
}

function parseItem(raw: any, categoryName: string): ScrapedItem {
  const itemId = String(raw.id);
  const title = (raw.title || '').trim();
  const slug = raw.slug || '';
  const url = slug
    ? `https://www.ouedkniss.com/${slug}-d${itemId}`
    : `https://www.ouedkniss.com/annonce-d${itemId}`;

  const rawPrice = Number(raw.pricePreview || raw.price || 0);
  const price = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 10000 : rawPrice;

  const city = (raw.cities || [])[0] || {};
  const wilaya = city.region?.name || city.name || '';

  const phones = (raw.phones || []).map((p: any) => p.phone).filter(Boolean);
  const userPhones = (raw.user?.phones || []).map((p: any) => p.phone).filter(Boolean);
  const phone = phones[0] || userPhones[0] || '';
  const whatsapp = phone.startsWith('05') || phone.startsWith('06') || phone.startsWith('07')
    ? `213${phone.slice(1)}`
    : '';

  const store = raw.store || {};
  const medias = (raw.medias || []).map((m: any) => m.mediaUrl).filter(Boolean);
  const primaryImg = raw.defaultMedia?.mediaUrl || medias[0] || '';

  return {
    id: `prod_ouedkniss_${itemId}`,
    title,
    price_da: Math.round(price),
    category: categoryName,
    wilaya,
    phone,
    whatsapp,
    is_store: Boolean(raw.isFromStore),
    store_name: store.name || '',
    url,
    image_url: primaryImg,
    published_at: raw.createdAt || raw.refreshedAt || '',
  };
}

async function runAggressiveCrawler() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
  };

  const category = getArg('--category', 'telephones');
  const maxPages = parseInt(getArg('--pages', '10'), 10);
  const concurrency = parseInt(getArg('--workers', '8'), 10);
  const outputFile = getArg('--output', `scraped_${category}.json`);

  console.log('='.repeat(70));
  console.log(`🚀 [CYBER-VACUUM] Moteur Worker Haute Concurrence (fetch + AbortController)`);
  console.log(`   Catégorie      : ${category}`);
  console.log(`   Pages cibles   : 1 à ${maxPages} (${maxPages * 60} annonces max)`);
  console.log(`   Workers actifs : ${concurrency} workers parallèles`);
  console.log('='.repeat(70));

  const tStart = Date.now();

  // Test page 1
  let p1 = await fetchPageWithAbort(category, 1, 60);
  if (!p1.success || !p1.items.length) {
    if (category !== 'all') {
      console.warn(`⚠️ 0 résultat pour "${category}" — essai de repli sans filtre...`);
      p1 = await fetchPageWithAbort('all', 1, 60);
    }
    if (!p1.success || !p1.items.length) {
      console.error(`❌ Échec de la page 1 : ${p1.error || 'Aucun résultat'}`);
      process.exit(1);
    }
  }

  const totalInCat = p1.total || 0;
  const lastPage = p1.lastPage || maxPages;
  const targetPages = Math.min(maxPages, lastPage);

  console.log(`📊 Marketplace : ${totalInCat.toLocaleString()} annonces détectées (${lastPage} pages)`);
  console.log(`⚡ Démarrage du pipeline worker à fenêtre glissante sur ${targetPages} pages...\n`);

  const allItems: ScrapedItem[] = [];
  const seenIds = new Set<string>();

  for (const raw of p1.items) {
    const item = parseItem(raw, category);
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      allItems.push(item);
    }
  }

  // Queue des pages restantes
  const queue: number[] = [];
  for (let p = 2; p <= targetPages; p++) queue.push(p);

  let completedCount = 1;

  // Modèle de concurrence agressive : chaque worker prend une tâche dès qu'il est libre
  const runWorker = async (workerId: number) => {
    while (queue.length > 0) {
      const page = queue.shift();
      if (typeof page === 'undefined') break;

      const res = await fetchPageWithAbort(category, page, 60);
      completedCount++;

      if (res.success && res.items.length > 0) {
        for (const raw of res.items) {
          const item = parseItem(raw, category);
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }

      const elapsedSec = Math.max(0.1, (Date.now() - tStart) / 1000);
      const rate = (allItems.length / elapsedSec).toFixed(1);
      const pct = ((completedCount / targetPages) * 100).toFixed(1);
      process.stdout.write(
        `   [${pct}%] Pages: ${completedCount}/${targetPages} | Annonces: ${allItems.length.toLocaleString()} | Débit: ${rate} art/sec\r`
      );
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, (_, i) => runWorker(i));
  await Promise.all(workers);

  const totalTimeSec = Math.max(0.01, (Date.now() - tStart) / 1000);
  const avgSpeed = (allItems.length / totalTimeSec).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log(`✅ CRAWL TERMINÉ AVEC SUCCÈS !`);
  console.log(`   Total annonces extraites   : ${allItems.length.toLocaleString()}`);
  console.log(`   Temps total d'exécution    : ${totalTimeSec.toFixed(2)} secondes`);
  console.log(`   Vitesse moyenne réelle     : ${avgSpeed} annonces / seconde`);
  console.log(`   Annonces avec téléphone    : ${allItems.filter((x) => x.phone).length.toLocaleString()}`);
  console.log(`   Boutiques professionnelles : ${allItems.filter((x) => x.is_store).length.toLocaleString()}`);

  fs.writeFileSync(outputFile, JSON.stringify(allItems, null, 2), 'utf-8');
  console.log(`📁 Fichier JSON scellé : ${path.resolve(outputFile)}`);

  const csvFile = outputFile.replace(/\.json$/i, '') + '.csv';
  if (allItems.length > 0) {
    const headers = Object.keys(allItems[0]);
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = allItems.map((item) => headers.map((h) => escapeCsv((item as any)[h])).join(','));
    fs.writeFileSync(csvFile, [headers.join(','), ...rows].join('\n'), 'utf-8');
    console.log(`📊 Fichier CSV scellé  : ${path.resolve(csvFile)}`);
  }
  console.log('='.repeat(70));
}

runAggressiveCrawler().catch((err) => {
  console.error('Fatal crawler error:', err);
  process.exit(1);
});
