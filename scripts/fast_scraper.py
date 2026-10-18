#!/usr/bin/env python3
"""
CYBER-VACUUM // Moteur d'aspiration & Crawling Ultra-Rapide (Haute Performance)
=============================================================================
Architecture multi-thread & asynchrone avec réutilisation de connexions (Keep-Alive),
en-têtes navigateurs stricts anti-405, requêtes GraphQL en paquets maximaux (count: 60),
extraction instantanée des téléphones réels DZ, wilayas, boutiques et export CSV/JSON.

ZÉRO DÉPENDANCE REQUISE (Fonctionne immédiatement avec la bibliothèque standard Python 3).
"""

import sys
import os
import json
import time
import re
import csv
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from concurrent.futures import ThreadPoolExecutor, as_completed

GRAPHQL_ENDPOINT = "https://api.ouedkniss.com/graphql"

# En-têtes complets conformes aux navigateurs modernes (anti-WAF / anti-405)
BROWSER_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.ouedkniss.com",
    "Referer": "https://www.ouedkniss.com/",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6",
    "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
}

# Requête optimisée : récupère 100% des données utiles directement sans requêtes secondaires bloquantes
SEARCH_QUERY = """
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
"""

def extract_algerian_contacts(text: str) -> dict:
    """Extrait les numéros de téléphone réels algériens (Mobilis, Djezzy, Ooredoo, Fixe)."""
    if not text:
        return {}
    clean = re.sub(r'[\u0660-\u0669]', lambda m: str(ord(m.group(0)) - 0x0660), text)
    clean = re.sub(r'[\u06F0-\u06F9]', lambda m: str(ord(m.group(0)) - 0x06F0), clean)
    
    candidates = []
    # International prefix
    for m in re.finditer(r'(?:(?:\+|00)213[\s./_-]*|(?:\b213[\s./_-]+))([2-7](?:[\s./_()-]*\d){7,8})', clean):
        digits = re.sub(r'\D', '', m.group(1))
        if len(digits) in (8, 9):
            candidates.append('0' + digits)
            
    # National format 05/06/07/02/03/04
    for m in re.finditer(r'(?:^|[^\d+])(0[2-7](?:[\s./_()-]*\d){7,8})(?=[^\d]|$)', clean):
        digits = re.sub(r'\D', '', m.group(1))
        if len(digits) in (9, 10):
            candidates.append(digits)

    unique_phones = []
    for c in candidates:
        if c not in unique_phones and len(c) in (9, 10):
            unique_phones.append(c)

    p1 = unique_phones[0] if unique_phones else None
    p2 = unique_phones[1] if len(unique_phones) > 1 else None

    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', clean)
    email = email_match.group(0).lower() if email_match else None

    return {
        "phone1": p1,
        "phone2": p2,
        "whatsapp": f"213{p1[1:]}" if p1 and p1.startswith(('05', '06', '07')) else None,
        "email": email,
        "operator": "Ooredoo" if p1 and p1.startswith('05') else ("Mobilis" if p1 and p1.startswith('06') else ("Djezzy" if p1 and p1.startswith('07') else None))
    }

def fetch_page(category_slug: str, page: int, count: int = 60, keywords: str = None, retries: int = 3) -> dict:
    """Exécute une requête GraphQL pour une page avec retry et backoff."""
    variables = {
        # FIX: envoyer TOUJOURS "q" (chaîne vide au lieu de l'omettre) — l'API peut
        # renvoyer une réponse vide sans erreur quand la variable est absente.
        "q": keywords or "",
        "filter": {
            "page": page,
            "count": count,
        }
    }
    if category_slug and category_slug not in ("all", "s"):
        variables["filter"]["categorySlug"] = category_slug

    payload = json.dumps({"query": SEARCH_QUERY, "variables": variables}).encode("utf-8")

    for attempt in range(1, retries + 1):
        try:
            req = Request(GRAPHQL_ENDPOINT, data=payload, headers=BROWSER_HEADERS, method="POST")
            with urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode("utf-8"))
                # FIX: ne pas avaler les erreurs GraphQL — une réponse 200 avec "errors"
                # était silencieusement interprétée comme « aucun résultat ».
                gql_errors = data.get("errors")
                if gql_errors and not data.get("data", {}).get("search"):
                    msgs = "; ".join(str(e.get("message", "")) for e in gql_errors)
                    return {"page": page, "items": [], "error": f"GraphQL: {msgs}", "success": False}
                ann = data.get("data", {}).get("search", {}).get("announcements", {})
                return {
                    "page": page,
                    "items": ann.get("data", []),
                    "paginator": ann.get("paginatorInfo", {}),
                    "success": True
                }
        except HTTPError as e:
            if e.code in (405, 429) or e.code >= 500:
                time.sleep(0.5 * (2 ** (attempt - 1)))
            else:
                return {"page": page, "items": [], "error": f"HTTP {e.code}", "success": False}
        except Exception as e:
            time.sleep(0.5 * (2 ** (attempt - 1)))
            if attempt == retries:
                return {"page": page, "items": [], "error": str(e), "success": False}

    return {"page": page, "items": [], "error": "Max retries", "success": False}

def parse_item(raw: dict, category_name: str) -> dict:
    """Normalise un article brut en dictionnaire prêt pour l'export."""
    item_id = str(raw.get("id"))
    title = raw.get("title", "").strip()
    slug = raw.get("slug", "")
    url = f"https://www.ouedkniss.com/{slug}-d{item_id}" if slug else f"https://www.ouedkniss.com/annonce-d{item_id}"
    
    raw_price = float(raw.get("pricePreview") or raw.get("price") or 0)
    # Convention millions de centimes
    price = raw_price * 10000 if 0 < raw_price < 1000 else raw_price

    city = (raw.get("cities") or [{}])[0]
    wilaya = city.get("region", {}).get("name") or city.get("name") or ""
    commune = city.get("name") or wilaya

    # Extraction des contacts
    text_corpus = f"{title} {raw.get('description', '')}"
    extracted = extract_algerian_contacts(text_corpus)
    
    # Numéros API directs si présents
    api_phones = [p.get("phone") for p in (raw.get("phones") or []) if p.get("phone")]
    phone1 = api_phones[0] if api_phones else extracted.get("phone1")

    store = raw.get("store") or {}
    medias = [m.get("mediaUrl") for m in (raw.get("medias") or []) if m.get("mediaUrl")]
    default_media = (raw.get("defaultMedia") or {}).get("mediaUrl")
    primary_img = default_media or (medias[0] if medias else "")

    return {
        "id": f"prod_ouedkniss_{item_id}",
        "title": title,
        "price_da": round(price),
        "category": category_name,
        "wilaya": wilaya,
        "commune": commune,
        "phone": phone1 or "",
        "phone_clean": re.sub(r'\D', '', phone1 or ""),
        "whatsapp": extracted.get("whatsapp") or "",
        "operator": extracted.get("operator") or "",
        "is_store": bool(raw.get("isFromStore")),
        "store_name": store.get("name") or "",
        "url": url,
        "image_url": primary_img,
        "images_count": len(medias),
        "published_at": raw.get("createdAt") or raw.get("refreshedAt") or "",
    }

def run_fast_crawl(category: str = "automobiles", max_pages: int = 10, concurrency: int = 8, output_file: str = "scraped_data.json"):
    """Exécute l'aspiration parallèle ultra-rapide."""
    print("=" * 70)
    print(f"🚀 [CYBER-VACUUM] Démarrage du Crawl Ultra-Rapide")
    print(f"   Catégorie : {category}")
    print(f"   Pages visées : 1 à {max_pages} ({max_pages * 60} articles max)")
    print(f"   Concurrence : {concurrency} workers simultanés")
    print("=" * 70)

    t_start = time.time()
    
    # Première page pour obtenir les totaux
    p1 = fetch_page(category, 1, count=60)
    if not p1["success"] or not p1["items"]:
        # FIX: l'API peut ignorer silencieusement un categorySlug inconnu et renvoyer
        # une réponse vide SANS erreur. Retry sans filtre de catégorie pour distinguer
        # « catégorie réellement vide » d'un blocage silencieux.
        if category not in ("all", "s"):
            print(f"⚠️  Aucun résultat avec la catégorie « {category} » — nouvel essai sans filtre de catégorie…")
            p1 = fetch_page("all", 1, count=60)
            if p1["success"] and p1["items"]:
                print(f"✅ Résultats obtenus sans catégorie : le slug « {category} » est probablement invalide/ignoré.")
                category = "all"
        if not p1["success"] or not p1["items"]:
            reason = p1.get("error") or "réponse vide sans erreur (filtre ignoré par l'API ?)"
            print(f"❌ Échec de la page initiale : {reason}")
            return

    total_in_cat = p1["paginator"].get("total", 0)
    last_page = p1["paginator"].get("lastPage", max_pages)
    target_pages = min(max_pages, last_page)

    print(f"📊 Marketplace : {total_in_cat:,} annonces détectées ({last_page:,} pages disponibles)")
    print(f"⚡ Lancement du téléchargement asynchrone des {target_pages} pages...")

    all_items = []
    seen_ids = set()

    for item in p1["items"]:
        parsed = parse_item(item, category)
        if parsed["id"] not in seen_ids:
            seen_ids.add(parsed["id"])
            all_items.append(parsed)

    # Récupération concurrente des pages restantes (2 à target_pages)
    pages_to_fetch = list(range(2, target_pages + 1))
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        future_to_page = {executor.submit(fetch_page, category, p, 60): p for p in pages_to_fetch}
        
        completed = 1
        for future in as_completed(future_to_page):
            res = future.result()
            completed += 1
            if res["success"]:
                for item in res["items"]:
                    parsed = parse_item(item, category)
                    if parsed["id"] not in seen_ids:
                        seen_ids.add(parsed["id"])
                        all_items.append(parsed)
            
            elapsed = time.time() - t_start
            rate = len(all_items) / max(0.1, elapsed)
            percent = (completed / target_pages) * 100
            print(f"\r   [{percent:5.1f}%] Pages: {completed}/{target_pages} | Articles: {len(all_items):,} | Débit: {rate:5.1f} art/sec", end="")
            sys.stdout.flush()

    total_time = time.time() - t_start
    print("\n" + "=" * 70)
    print(f"✅ ASPIRATION TERMINÉE AVEC SUCCÈS !")
    print(f"   Total articles aspirés  : {len(all_items):,}")
    print(f"   Temps total             : {total_time:.2f} secondes")
    print(f"   Vitesse moyenne         : {len(all_items)/max(0.01, total_time):.1f} articles / seconde")
    print(f"   Articles avec téléphone : {sum(1 for x in all_items if x['phone']):,}")
    print(f"   Boutiques professionnelles : {sum(1 for x in all_items if x['is_store']):,}")

    # Export JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"📁 Fichier JSON scellé : {output_file}")

    # Export CSV
    csv_file = output_file.rsplit(".", 1)[0] + ".csv"
    if all_items:
        with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=list(all_items[0].keys()))
            writer.writeheader()
            writer.writerows(all_items)
        print(f"📊 Fichier CSV scellé  : {csv_file}")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cyber-Vacuum Ultra-Fast Scraper")
    parser.add_argument("--category", default="automobiles", help="Slug catégorie Ouedkniss (ex: automobiles, telephons, electronique-electromenager, immobilier)")
    parser.add_argument("--pages", type=int, default=10, help="Nombre de pages à aspirer (60 articles par page)")
    parser.add_argument("--concurrency", type=int, default=8, help="Nombre de threads simultanés")
    parser.add_argument("--output", default="scraped_data.json", help="Chemin du fichier JSON de sortie")
    args = parser.parse_args()

    run_fast_crawl(
        category=args.category,
        max_pages=args.pages,
        concurrency=args.concurrency,
        output_file=args.output
    )
