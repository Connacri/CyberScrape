import React, { useState } from 'react';
import { ScrapedProduct, SellerInfo } from '../types';
import {
  X,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Truck,
  Sparkles,
  Info,
  Clock,
  UserCheck,
  Share2,
  MessageSquare,
  AlertTriangle,
  Flame,
  ChevronRight,
  Code,
} from 'lucide-react';
import {
  ensureProductDetails,
  buildWhatsAppLink,
  buildTelLink,
  buildSmsLink,
} from '../utils/sellerGenerator';

interface ProductDetailModalProps {
  product: ScrapedProduct;
  onClose: () => void;
  onInspectJson?: (product: ScrapedProduct) => void;
  onSyncSupabase?: (product: ScrapedProduct) => void;
  isSyncingSupabase?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: rawProduct,
  onClose,
  onInspectJson,
  onSyncSupabase,
  isSyncingSupabase,
}) => {
  // Ensure product has all seller and announcement details
  const product = ensureProductDetails(rawProduct);
  const seller: SellerInfo = product.seller!;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'seller' | 'specs' | 'json'>('details');

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const activeImage = images[activeImageIndex] || product.imageUrl;

  const formattedPrice = new Intl.NumberFormat('fr-DZ').format(product.currentPrice);
  const formattedOriginalPrice = new Intl.NumberFormat('fr-DZ').format(product.originalPrice);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(seller.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const telLink = buildTelLink(seller);
  const whatsAppLink = buildWhatsAppLink(seller, product);
  const smsLink = buildSmsLink(seller, product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-[0_0_50px_rgba(0,255,102,0.15)] flex flex-col font-sans text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* 1. TOP HEADER BAR                                             */}
        {/* ============================================================== */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-slate-950/95 border-b border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 truncate">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              OUEDKNISS ANNONCE DÉTAILLÉE
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 truncate">
              Réf : {product.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Copier le lien"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Fermer la fiche"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. BODY CONTENT (SCROLLABLE)                                   */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Main 2-column Layout: Gallery on Left, Core Transaction Card on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: GALLERY & IMAGES (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Large Image Showcase */}
              <div className="relative aspect-square w-full rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden shadow-inner group">
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Discount Badge */}
                {product.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-xs tracking-wider shadow-lg border border-rose-400/40">
                    -{product.discountPercent}% RÉDUCTION
                  </div>
                )}

                {/* Condition Badge */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/85 text-emerald-400 font-mono text-[11px] border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{product.specs?.['État'] || 'Vérifié Ouedkniss'}</span>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img src={img} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust & Delivery Highlights */}
              <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Truck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">Livraison 58 Wilayas disponible</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Expédition via Yalidine Express, Procolis ou ZR Express avec paiement sécurisé à la réception (contre-remboursement).
                </p>
              </div>
            </div>

            {/* RIGHT: TITLE, PRICE & DIRECT CONTACT ACTIONS (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                {/* Category & Wilaya Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold uppercase">
                    {product.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {seller.wilaya}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {product.publishedDate || 'Publié récemment'}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-white leading-snug">
                  {product.title}
                </h1>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-wrap items-baseline justify-between gap-3 shadow-lg">
                  <div>
                    <span className="text-xs font-mono text-emerald-400/80 block uppercase tracking-wider">
                      Prix demandé
                    </span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-black font-mono text-[#00ff66] tracking-tight">
                        {formattedPrice} {product.currency}
                      </span>
                      {product.discountPercent > 0 && (
                        <span className="text-sm font-mono text-slate-500 line-through">
                          {formattedOriginalPrice} {product.currency}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                      {product.priceType || 'Prix Fixe'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {product.inStock ? '✓ Disponible immédiatement' : 'Rupture'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 🔥 WHO PUBLISHED IT & DIRECT CLICK-TO-CALL / WHATSAPP CARD   */}
              {/* ============================================================== */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(0,255,102,0.12)] space-y-4">
                {/* Seller Persona Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={seller.avatarUrl}
                        alt={seller.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm sm:text-base">{seller.name}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                          ✓ VÉRIFIÉ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="text-cyan-400">{seller.type}</span>
                        <span>•</span>
                        <span>{seller.memberSince}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-amber-400 font-mono font-bold text-sm flex items-center gap-1">
                      ★ {seller.rating?.toFixed(1) || '4.9'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {seller.reviewsCount || 42} avis vérifiés
                    </span>
                  </div>
                </div>

                {/* Seller Status & Wilaya */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {seller.responseTime}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {seller.wilaya}
                  </span>
                </div>

                {/* ============================================================== */}
                {/* 1-CLICK CALL & 1-CLICK WHATSAPP BUTTONS (CORE REQUIREMENT)     */}
                {/* ============================================================== */}
                <div className="space-y-2 pt-1">
                  {/* DIRECT CALL BUTTON: Click directly calls the phone number */}
                  <a
                    href={telLink}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff66] to-emerald-400 text-slate-950 font-mono font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer group"
                    title={`Appeler directement le vendeur au ${seller.phone}`}
                  >
                    <PhoneCall className="w-5 h-5 text-slate-950 animate-bounce group-hover:scale-110 transition-transform" />
                    <span>APPEL DIRECT : {seller.phone}</span>
                  </a>

                  {/* DIRECT WHATSAPP BUTTON: Click opens WhatsApp with prefilled message */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                      title="Contacter instantanément le vendeur sur WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span>WhatsApp Direct</span>
                    </a>

                    {/* COPY NUMBER BUTTON */}
                    <button
                      onClick={handleCopyPhone}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      title="Copier le numéro de téléphone dans le presse-papier"
                    >
                      {copiedPhone ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Numéro copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" />
                          <span>Copier numéro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Numéro algérien vérifié par SMS sur Ouedkniss</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. TABS: DESCRIPTION / SPÉCIFICATIONS / SÉCURITÉ               */}
          {/* ============================================================== */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📝 Description Complète
              </button>

              <button
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'specs'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⚙️ Fiche Technique & Spécifications ({Object.keys(product.specs || {}).length})
              </button>

              <button
                onClick={() => setActiveTab('seller')}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                👤 Vendeur & Coordonnées
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={`hidden sm:inline-block px-3 py-2 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Code className="w-3.5 h-3.5 inline mr-1" />
                Données JSON
              </button>
            </div>

            {/* TAB 1: DESCRIPTION */}
            {activeTab === 'details' && (
              <div className="pt-4 space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans select-text">
                  {product.description}
                </div>

                {/* Safety advice banner */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-amber-300 font-bold block">
                      Conseils de sécurité pour la transaction Ouedkniss :
                    </strong>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      N'envoyez jamais d'acompte par BaridiMob ou virement avant d'avoir vérifié l'article. Privilégiez
                      la remise en main propre dans un lieu public ou la livraison avec paiement à l'ouverture du colis.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SPECS TABLE */}
            {activeTab === 'specs' && (
              <div className="pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Category, Brand, Wilaya */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Catégorie</span>
                    <span className="text-sm font-semibold text-slate-200">{product.category}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Marque</span>
                    <span className="text-sm font-semibold text-slate-200">{product.brand || 'D\'origine'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Wilaya / Commune</span>
                    <span className="text-sm font-semibold text-emerald-400">{seller.wilaya}</span>
                  </div>

                  {/* Extracted Specs from Ouedkniss */}
                  {product.specs &&
                    Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">{key}</span>
                        <span className="text-sm font-semibold text-slate-200">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: SELLER DETAILS */}
            {activeTab === 'seller' && (
              <div className="pt-4 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={seller.avatarUrl}
                      alt={seller.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {seller.name}
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </h3>
                      <p className="text-xs text-cyan-400 font-mono">{seller.type}</p>
                      <p className="text-xs text-slate-400 mt-1">{seller.memberSince}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">TÉLÉPHONE PRINCIPAL</span>
                      <strong className="text-emerald-400 text-sm">{seller.phone}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">LOCALISATION</span>
                      <strong className="text-white text-sm">{seller.wilaya}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">RÉACTIVITÉ</span>
                      <strong className="text-cyan-400 text-sm">{seller.responseTime}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href={telLink}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-center hover:bg-emerald-400 transition-colors cursor-pointer"
                    >
                      Appeler {seller.phone}
                    </a>
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] text-white font-mono font-bold text-center hover:bg-[#20ba59] transition-colors cursor-pointer"
                    >
                      WhatsApp ({seller.name})
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: JSON INSPECTOR */}
            {activeTab === 'json' && (
              <div className="pt-4">
                <div className="p-4 rounded-2xl bg-black border border-emerald-500/20 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 select-text">
                  <pre>{JSON.stringify(product, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. FOOTER ACTIONS BAR                                         */}
        {/* ============================================================== */}
        <div className="sticky bottom-0 z-30 flex items-center justify-between px-5 py-3.5 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voir sur Ouedkniss.com</span>
            </a>

            {onInspectJson && (
              <button
                onClick={() => onInspectJson(product)}
                className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 font-mono text-xs items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>ADN Matrix</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-[#20ba59] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contacter</span> WhatsApp
            </a>

            <a
              href={telLink}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-950" />
              <span>Appeler {seller.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
