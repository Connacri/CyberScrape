import type { ScrapedProduct, SellerInfo } from '../types/index.ts';
import { getOuedknissOriginUrl } from './ouedknissUrls.ts';

/**
 * Les générateurs de vendeurs / téléphones / emails / descriptions / galeries d'images
 * (generateSellerForProduct, generateAlgerianPhone, generateSellerEmail, generateAnnouncementDescription,
 * generateGalleryImages) ont été SUPPRIMÉS : ils fabriquaient des coordonnées. Plus aucune donnée factice.
 */

/**
 * Normalise l'annonce sans fabriquer de fausses coordonnées :
 * - Garantit un objet seller minimal si absent pour éviter les exceptions de rendu UI
 * - Normalise l'URL Ouedkniss
 */
export function ensureProductDetails(product: ScrapedProduct): ScrapedProduct {
  if (!product.productUrl && product.sourceDomain?.includes('ouedkniss')) {
    product.productUrl = getOuedknissOriginUrl(product);
  }
  if (!product.seller) {
    const wilaya = product.specs?.Wilaya || 'Algérie';
    const name = product.specs?.Vendeur || product.brand || 'Particulier Ouedkniss';
    product.seller = {
      name,
      type: 'Particulier',
      phone: '',
      phoneClean: '',
      whatsappClean: '',
      email: '',
      wilaya,
      verified: false,
    };
  }
  return product;
}

/**
 * Builds direct WhatsApp URL with pre-filled message
 */
export function buildWhatsAppLink(seller?: SellerInfo, product?: ScrapedProduct): string {
  if (!seller) return '#';
  const cleanNumber = (seller.whatsappClean || seller.phoneClean || '').replace(/[^0-9]/g, '');
  if (!cleanNumber) return '#';
  const priceFormatted = product ? new Intl.NumberFormat('fr-DZ').format(product.currentPrice) : '';
  const message = product
    ? `Salem Alikoum, je vous contacte depuis Ouedkniss concernant votre annonce : "${product.title}" affichée à ${priceFormatted} ${product.currency}. Est-elle toujours disponible ?`
    : `Salem Alikoum, je vous contacte depuis Ouedkniss concernant votre annonce. Est-elle toujours disponible ?`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds direct Tel URI for 1-click calling
 */
export function buildTelLink(seller?: SellerInfo): string {
  if (!seller?.phoneClean && !seller?.phone) return '#';
  const clean = (seller.phoneClean || seller.phone).replace(/[^0-9]/g, '');
  if (!clean) return '#';
  if (clean.startsWith('0')) {
    return `tel:+213${clean.substring(1)}`;
  }
  if (clean.startsWith('213')) {
    return `tel:+${clean}`;
  }
  return `tel:${clean}`;
}

/**
 * Builds direct Tel URI for 2nd phone number (2ème numéro de téléphone)
 */
export function buildTelLink2(seller?: SellerInfo): string {
  if (!seller?.phone2Clean && !seller?.phone2) return buildTelLink(seller);
  const clean = (seller.phone2Clean || seller.phone2 || '').replace(/[^0-9]/g, '');
  if (!clean) return buildTelLink(seller);
  if (clean.startsWith('0')) {
    return `tel:+213${clean.substring(1)}`;
  }
  if (clean.startsWith('213')) {
    return `tel:+${clean}`;
  }
  return `tel:${clean}`;
}

/**
 * Builds direct SMS URI
 */
export function buildSmsLink(seller?: SellerInfo, product?: ScrapedProduct): string {
  if (!seller?.phoneClean && !seller?.phone) return '#';
  const clean = (seller.phoneClean || seller.phone).replace(/[^0-9]/g, '');
  if (!clean) return '#';
  const message = product ? `Bonjour, je suis intéressé par votre annonce Ouedkniss : ${product.title}` : `Bonjour, je suis intéressé par votre annonce Ouedkniss.`;
  return `sms:${clean}?body=${encodeURIComponent(message)}`;
}

/**
 * Builds direct Mailto URI with pre-filled subject and message
 */
export function buildMailtoLink(seller?: SellerInfo, product?: ScrapedProduct): string {
  const email = seller?.email || '';
  if (!email) return '#';
  const sellerName = seller?.name || 'Vendeur';
  const subject = product
    ? `Demande d'information - Annonce Ouedkniss : ${product.title}`
    : `Contact vendeur Ouedkniss : ${sellerName}`;
  const priceText = product ? `${new Intl.NumberFormat('fr-DZ').format(product.currentPrice)} ${product.currency}` : '';
  const body = product
    ? `Salem Alikoum / Bonjour ${sellerName},\n\nJe vous contacte concernant votre annonce Ouedkniss :\n"${product.title}" (${priceText}).\n\nL'article est-il toujours disponible ?\n\nMerci d'avance pour votre réponse.\nCordialement,`
    : `Salem Alikoum / Bonjour ${sellerName},\n\nJe vous contacte depuis la plateforme Ouedkniss concernant vos annonces en ligne.\n\nCordialement,`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Boutique / annonce : uniquement d'après des champs RÉELS (type de vendeur issu de l'API, nom de boutique, drapeaux).
 * Les anciennes heuristiques par mots-clés (« tech », « auto », « pro »…) qui classaient des particuliers en boutiques sont supprimées.
 */
export function isOfficialStoreProduct(product: ScrapedProduct): boolean {
  if (product.seller) {
    const s = product.seller;
    if (s.type && s.type !== 'Particulier') return true;
    if (s.storeName && s.storeName.trim().length > 0) return true;
  }
  return Boolean(product.isOfficialStore || product.itemType === 'boutique');
}
