# RAPPORT D'ANALYSE TECHNIQUE & INGÉNIERIE INVERSE DE OUEDKNISS.COM
**Projet** : Connacri / CyberScrape — Moteur d'Aspiration Matricielle Haute Fidélité  
**Date d'analyse** : 2026-10-18  
**Auteur** : Expert Scraping, Reverse Engineering & Data Engineering  

---

## 1. ENDPOINTS RÉSEAU & API OFFICIELLE

### 1.1 Endpoint Principal : GraphQL Officiel
Ouedkniss fonctionne sur une architecture moderne Nuxt.js/Vue.js connectée à une API GraphQL publique.
- **Endpoint URL** : `https://api.ouedkniss.com/graphql`
- **Méthode HTTP** : `POST`
- **Format Payload** : `application/json` (`{"query": "...", "variables": {...}}`)
- **Authentification** : Non requise pour la consultation des annonces, des catégories, des wilayas et des profils boutiques publics.
- **En-têtes HTTP Requis** :
  ```http
  Content-Type: application/json
  Accept: application/json, text/plain, */*
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36
  Origin: https://www.ouedkniss.com
  Referer: https://www.ouedkniss.com/
  ```

---

## 2. SCHÉMAS DES REQUÊTES GRAPHQL & VARIABLES

### 2.1 Requête de Recherche & Pagination (`Search`)
```graphql
query SearchAnnouncements($q: String, $filter: SearchFilterInput) {
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
        hasExchange
        hasDelivery
        isPromoted
        isUrgent
        price
        pricePreview
        priceUnit
        pricingType
        status
        phones {
          phone
          hasWhatsapp
          hasViber
        }
        defaultMedia {
          mediaUrl
          mimeType
          thumbnail
        }
        medias {
          mediaUrl
          mimeType
          thumbnail
        }
        cities {
          id
          name
          region {
            id
            name
          }
        }
        specs {
          specification {
            codename
            label
          }
          valueText
        }
        user {
          id
          username
          phones {
            phone
            hasWhatsapp
            hasViber
          }
        }
        store {
          id
          name
          slug
          imageUrl
          bannerUrl
          description
          url
          isCertified
        }
      }
      paginatorInfo {
        currentPage
        lastPage
        hasMorePages
        perPage
        total
      }
    }
  }
}
```

**Variables (`SearchFilterInput`)** :
```json
{
  "filter": {
    "page": 1,
    "count": 28,
    "categorySlug": "telephones",
    "regionsIds": [16],
    "priceRange": [10000, 150000]
  }
}
```

### 2.2 Requête Détail d'Annonce & Annonces Similaires (`announcementGet`)
```graphql
query GetAnnouncementDetail($id: ID!) {
  announcementGet(id: $id) {
    id
    title
    slug
    description
    refreshedAt
    createdAt
    isFromStore
    price
    pricePreview
    priceUnit
    hasExchange
    hasDelivery
    status
    phones {
      phone
      hasWhatsapp
      hasViber
    }
    defaultMedia {
      mediaUrl
    }
    medias {
      mediaUrl
      mimeType
    }
    user {
      id
      username
      phones {
        phone
        hasWhatsapp
        hasViber
      }
    }
    store {
      id
      name
      slug
      imageUrl
      bannerUrl
      description
      url
      isCertified
    }
    specs {
      specification {
        codename
        label
      }
      valueText
    }
    cities {
      id
      name
      region {
        id
        name
      }
    }
    similars {
      id
      title
      slug
      price
      defaultMedia {
        mediaUrl
      }
    }
  }
}
```

### 2.3 Requête Profil & Contacts Boutique (`storeGet`)
```graphql
query GetStoreProfile($id: ID!) {
  storeGet(id: $id) {
    id
    name
    slug
    url
    description
    imageUrl
    bannerUrl
    isCertified
    mainLocation {
      id
      address
      phones {
        id
        phone
        hasWhatsapp
        hasViber
      }
      city {
        id
        name
        region {
          id
          name
        }
      }
    }
    locations {
      id
      address
      phones {
        id
        phone
        hasWhatsapp
        hasViber
      }
      city {
        id
        name
      }
    }
  }
}
```

---

## 3. DIAGNOSTIC DU BLOCAGE À 34 740 ET INTERRUPTION À LA 3ÈME CATÉGORIE

### 3.1 Pourquoi 34 740 ?
1. **Plafond d'offset du moteur d'indexation (Elasticsearch / OpenSearch)** :
   Ouedkniss impose une limite stricte de pagination : **1 240 ou 1 241 pages**.
   $$\text{Offset Maximum} = 1241 \times 28 = 34\,748 \text{ annonces}$$
   Au-delà de la page 1 240, l'API renvoie `data: []` ou une erreur `Result window is too large`.
2. **Interruption à la 3ème catégorie (Bugs identifiés dans le code précédent)** :
   - **Circuit breaker excessif dans `server.ts`** : sur la moindre lenteur ou timeout réseau, `domainCircuitBreaker.set(domain, Date.now() + 5 * 60 * 1000)` bloquait toutes les requêtes subséquentes pendant 5 minutes.
   - **Blocage arbitraire de pagination** : `if (pageNum > 1 && domain.includes('ouedkniss')) return null;` arrêtait brutalement le crawler.
   - **Timeout trop court** : `timeout = 6000ms` sur GraphQL provoquait des `AbortError` non gérés qui renvoyaient des tableaux vides et scellaient prématurément la catégorie.
   - **Absence de partitionnement** : sans découpage par wilaya/région, les catégories massives (Automobiles, Immobilier) heurtaient le plafond de pagination dès le début.

### 3.2 Stratégie de Résolution par Découpage
Pour aspirer 100% du catalogue sans heurter le plafond :
1. **Partitionnement Catégorie $\times$ Wilaya** : les 17 catégories sont subdivisées par les 58 Wilayas d'Algérie (`regionsIds: [codeWilaya]`).
2. **Partitionnement Fin par Tranches de Prix** : pour les couples (Catégorie, Wilaya) dont le `total` dépasse 1 000 annonces (ex. Automobiles à Alger), sous-découpage par tranche de prix (`priceRange: [min, max]`).
3. **Exploration des Annonces Similaires (`similars`)** : chaque annonce injecte ses annonces similaires dans une file de découverte dédupliquée par `source_id`.

---

## 4. GESTION DES CONTACTS & CHAMPS GATED (AUTHENTIFICATION / CAPTCHA)

1. **Provenance des contacts** :
   Chaque numéro ou email extrait porte obligatoirement son étiquette de provenance :
   - `announcement_graphql` : fourni directement dans le champ `phones` de l'annonce.
   - `user_graphql` : fourni dans l'objet `user.phones` du profil vendeur.
   - `store_graphql` : fourni dans l'objet `mainLocation.phones` ou `locations[].phones` via la requête `storeGet`.
   - `description_regex` : extrait du texte libre de la description ou du titre par expression régulière (avec normalisation des chiffres arabo-indiens `٠-٩`).
2. **Statut des contacts (`contacts_status`)** :
   - `'ok'` : contacts extraits avec succès.
   - `'none'` : aucun contact public renseigné par l'annonceur.
   - `'failed'` : erreur réseau / timeout lors de la tentative de récupération.
3. **Champs Gated / Protégés** :
   Si un contact n'est pas accessible sans compte connecté ou résolu par CAPTCHA, il est **strictement laissé à `NULL`** conformément à la règle d'intégrité et de respect des conditions d'accès. Aucune tentative de contournement ni valeur fictive.

---

## 5. MAPPING DES CHAMPS API → SCHÉMA SUPABASE

| Champ API GraphQL Source | Table & Colonne Supabase | Type SQL | Règle / Traitement |
|---|---|---|---|
| `id` | `listings.source_id` | `text UNIQUE` | Identifiant source immuable |
| `title` | `listings.title` | `text NOT NULL` | Texte UTF-8 strict brut (Arabe/Français) |
| `slug` | `listings.url` | `text NOT NULL` | `https://www.ouedkniss.com/${slug}-d${id}` |
| `slug` | `listings.url_encoded` | `text NOT NULL` | URL percent-encodée |
| `description` | `listings.description` | `text` | Texte complet sans troncature |
| `price` | `listings.price` | `numeric` | Valeur numérique réelle ou NULL |
| `pricePreview` | `listings.price_raw` | `text` | Texte brut de prix renvoyé par l'API |
| `priceUnit` | `listings.price_unit` | `text` | Unité réelle (ex. "Millions", "DA") |
| Devise | `listings.currency` | `text` | Devise réelle ('DA') |
| `pricingType` | `listings.negotiable` | `boolean` | `true` si 'NEGOTIABLE', sinon `false` ou `NULL` |
| `categorySlug` | `listings.category_id` | `text FK` | Référence `categories(slug)` |
| `user` / `store` | `listings.seller_id` | `uuid FK` | Référence `sellers(id)` |
| `cities[0].region.name` | `listings.region` | `text` | Wilaya réelle |
| `cities[0].name` | `listings.city` | `text` | Commune réelle |
| `createdAt` | `listings.published_at` | `timestamptz` | Date de publication |
| `refreshedAt` | `listings.refreshed_at` | `timestamptz` | Date de rafraîchissement |
| `isFromStore` | `listings.is_store` | `boolean` | Vendeur boutique pro |
| `isPromoted` | `listings.is_promo` | `boolean` | Badge promo réel |
| `isUrgent` | `listings.is_urgent` | `boolean` | Badge urgent réel |
| `specs` | `listings.specs` | `jsonb` | Spécifications réelles complètes |
| Objet complet | `listings.raw` | `jsonb` | Payload JSON brut complet |
| `medias[].mediaUrl` | `listing_images` | `url`, `position` | Images réelles ordonnées, vérifiées HEAD |
| `similars[].id` | `listing_similars` | `similar_source_id` | Annonces similaires dédupliquées |
| `phones` avec source | `sellers.phones` | `jsonb` | `[{number, has_whatsapp, has_viber, source}]` |
| `email` | `sellers.emails` | `text[]` | Adresses email réelles ou NULL |
