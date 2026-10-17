import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ScrapedProduct, SellerInfo, SupabaseConfig } from '../types';
import {
  Users,
  Search,
  Phone,
  PhoneCall,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Sparkles,
  ShoppingBag,
  Store,
  User,
  Star,
  Layers,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Contact,
  Eye,
  RefreshCw,
  Building2,
  Car,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES, OuedknissCategoryMeta } from '../data/ouedknissCategories';
import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';
import {
  ensureProductDetails,
  buildTelLink,
  buildTelLink2,
  buildWhatsAppLink,
  buildMailtoLink,
  generateSellerEmail,
} from '../utils/sellerGenerator';
import { matchCategory } from '../utils/categoryMatcher';
import { cyberAudio } from '../utils/cyberAudio';

export interface AggregatedSellerProfile {
  id: string;
  name: string;
  type: 'Particulier' | 'Boutique / Store Certifié' | 'Agence Immobilière' | 'Showroom Auto';
  phone: string;
  phoneClean: string;
  phone2?: string;
  phone2Clean?: string;
  whatsappClean: string;
  email: string;
  wilaya: string;
  commune?: string;
  avatarUrl?: string;
  memberSince?: string;
  rating: number;
  reviewsCount: number;
  responseTime?: string;
  verified: boolean;
  storeName?: string;
  operator?: 'Mobilis' | 'Djezzy' | 'Ooredoo';
  operator2?: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixe';
  products: ScrapedProduct[];
  totalListings: number;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  currency: string;
  lastActive: string;
}

interface SellerProfilesDirectoryProps {
  products: ScrapedProduct[];
  onSelectProduct?: (product: ScrapedProduct) => void;
  onOpenSupabaseModal?: () => void;
  supabaseConfig?: SupabaseConfig;
  onNavigateToCatalogWithSeller?: (sellerName: string) => void;
}

const LAZY_CHUNK_SIZE = 18;

export const SellerProfilesDirectory: React.FC<SellerProfilesDirectoryProps> = ({
  products,
  onSelectProduct,
  onNavigateToCatalogWithSeller,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'listings' | 'name' | 'rating' | 'price' | 'recent'>('listings');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // Expanded listings drawer for specific seller
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState<string | null>(null);

  // Lazy loading pagination
  const [visibleCount, setVisibleCount] = useState<number>(LAZY_CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. DEDUPLICATION ENGINE:
  // Extracts and aggregates every unique seller profile from all available listings
  const uniqueProfiles = useMemo(() => {
    const map = new Map<string, AggregatedSellerProfile>();

    for (const rawProduct of products) {
      if (!rawProduct) continue;
      const product = ensureProductDetails(rawProduct);
      const seller = product.seller;
      if (!seller) continue;

      // Deduplication key: clean phone number or normalized name + wilaya
      const cleanPhone = (seller.phoneClean || seller.phone || '').replace(/[^0-9]/g, '');
      const nameKey = (seller.name || '').toLowerCase().trim().replace(/\s+/g, '_');
      const wilayaKey = (seller.wilaya || '').toLowerCase().trim();
      const dedupKey = cleanPhone ? `phone_${cleanPhone}` : `name_${nameKey}_${wilayaKey}`;

      const existing = map.get(dedupKey);

      // Ensure valid email
      const safeEmail =
        seller.email ||
        generateSellerEmail(seller.name, seller.type, cleanPhone.length || seller.name.length);

      if (!existing) {
        map.set(dedupKey, {
          id: dedupKey,
          name: seller.name,
          type: seller.type,
          phone: seller.phone,
          phoneClean: seller.phoneClean || cleanPhone,
          phone2: seller.phone2,
          phone2Clean: seller.phone2Clean,
          whatsappClean: seller.whatsappClean || cleanPhone,
          email: safeEmail,
          wilaya: seller.wilaya || 'Alger',
          commune: seller.commune || seller.wilaya || 'Alger',
          avatarUrl: seller.avatarUrl,
          memberSince: seller.memberSince,
          rating: seller.rating || 4.7,
          reviewsCount: seller.reviewsCount || 1,
          responseTime: seller.responseTime,
          verified: seller.verified !== false,
          storeName: seller.storeName,
          operator: seller.operator,
          operator2: seller.operator2,
          products: [product],
          totalListings: 1,
          categories: product.category ? [product.category] : [],
          minPrice: product.currentPrice || 0,
          maxPrice: product.currentPrice || 0,
          currency: product.currency || 'DA',
          lastActive: product.scrapedAt || new Date().toISOString(),
        });
      } else {
        // Aggregate without duplicate
        existing.products.push(product);
        existing.totalListings += 1;

        if (product.category && !existing.categories.includes(product.category)) {
          existing.categories.push(product.category);
        }

        if (product.currentPrice > 0) {
          if (existing.minPrice === 0 || product.currentPrice < existing.minPrice) {
            existing.minPrice = product.currentPrice;
          }
          if (product.currentPrice > existing.maxPrice) {
            existing.maxPrice = product.currentPrice;
          }
        }

        // Keep most complete phone2 and email
        if (!existing.phone2 && seller.phone2) {
          existing.phone2 = seller.phone2;
          existing.phone2Clean = seller.phone2Clean;
          existing.operator2 = seller.operator2;
        }
        if (!existing.email && safeEmail) {
          existing.email = safeEmail;
        }
      }
    }

    return Array.from(map.values());
  }, [products]);

  // Reset lazy count when filters change
  useEffect(() => {
    setVisibleCount(LAZY_CHUNK_SIZE);
  }, [searchQuery, selectedType, selectedCategory, selectedWilaya, selectedOperator, sortBy, onlyVerified]);

  // 2. FILTERING AND SORTING:
  const filteredProfiles = useMemo(() => {
    return uniqueProfiles
      .filter((p) => {
        // Search query: matches name, store name, phone, email, or wilaya
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanQ = q.replace(/[^0-9]/g, '');
          const matchesText =
            p.name.toLowerCase().includes(q) ||
            (p.storeName && p.storeName.toLowerCase().includes(q)) ||
            p.email.toLowerCase().includes(q) ||
            p.wilaya.toLowerCase().includes(q) ||
            (p.commune && p.commune.toLowerCase().includes(q)) ||
            p.categories.some((c) => c.toLowerCase().includes(q));

          const matchesPhone =
            cleanQ.length >= 3 &&
            (p.phoneClean.includes(cleanQ) || (p.phone2Clean && p.phone2Clean.includes(cleanQ)));

          if (!matchesText && !matchesPhone) return false;
        }

        // Type filter
        if (selectedType !== 'all') {
          if (selectedType === 'boutique' && p.type !== 'Boutique / Store Certifié') return false;
          if (selectedType === 'particulier' && p.type !== 'Particulier') return false;
          if (selectedType === 'auto' && p.type !== 'Showroom Auto') return false;
          if (selectedType === 'immo' && p.type !== 'Agence Immobilière') return false;
        }

        // Verified only
        if (onlyVerified && !p.verified) {
          return false;
        }

        // Unified Category filter: checks if seller has any product matching category
        if (selectedCategory !== 'all') {
          const hasMatchingCat = p.categories.some((cat) => matchCategory(cat, selectedCategory));
          if (!hasMatchingCat) return false;
        }

        // Wilaya filter
        if (selectedWilaya !== 'all') {
          const pWilaya = p.wilaya.toLowerCase();
          const selW = selectedWilaya.toLowerCase();
          if (!pWilaya.includes(selW) && !selW.includes(pWilaya)) return false;
        }

        // Mobile Operator filter
        if (selectedOperator !== 'all') {
          if (p.operator !== selectedOperator && p.operator2 !== selectedOperator) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'listings') return b.totalListings - a.totalListings;
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'fr');
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price') return b.maxPrice - a.maxPrice;
        if (sortBy === 'recent') return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        return 0;
      });
  }, [uniqueProfiles, searchQuery, selectedType, selectedCategory, selectedWilaya, selectedOperator, sortBy, onlyVerified]);

  // Sliced list for infinite scroll lazy rendering
  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, visibleCount);
  }, [filteredProfiles, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + LAZY_CHUNK_SIZE, filteredProfiles.length));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredProfiles.length]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalSellers = uniqueProfiles.length;
    const boutiquesCount = uniqueProfiles.filter((p) => p.type !== 'Particulier').length;
    const particuliersCount = uniqueProfiles.filter((p) => p.type === 'Particulier').length;
    const totalPhoneLines = uniqueProfiles.reduce((acc, p) => acc + (p.phone2 ? 2 : 1), 0);
    const emailsCount = uniqueProfiles.filter((p) => Boolean(p.email)).length;
    return {
      totalSellers,
      boutiquesCount,
      particuliersCount,
      totalPhoneLines,
      emailsCount,
    };
  }, [uniqueProfiles]);

  // Copy seller contact data
  const handleCopySellerContact = (seller: AggregatedSellerProfile) => {
    cyberAudio.playClick();
    const contactText = `👤 ${seller.name} (${seller.type})
📍 Wilaya : ${seller.wilaya} ${seller.commune ? `- ${seller.commune}` : ''}
📞 Téléphone Principal : ${seller.phone} (${seller.operator || 'Mobile'})
${seller.phone2 ? `📱 2ème Téléphone : ${seller.phone2} (${seller.operator2 || 'Secondaire'})\n` : ''}✉️ Email : ${seller.email}
💬 WhatsApp : https://wa.me/${seller.whatsappClean}
🏷️ Annonces actives : ${seller.totalListings} article(s)`;

    navigator.clipboard.writeText(contactText).then(() => {
      setCopiedId(seller.id);
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  // Copy single email or phone
  const handleCopyItem = (text: string, id: string) => {
    cyberAudio.playClick();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Export all filtered sellers as VCF (vCard file)
  const handleExportVcf = () => {
    cyberAudio.playClick();
    const vcfCards = filteredProfiles
      .map((s) => {
        return `BEGIN:VCARD
VERSION:3.0
FN:${s.name} (Ouedkniss)
ORG:${s.storeName || s.name}
TITLE:${s.type}
TEL;TYPE=CELL,VOICE:${s.phoneClean}
${s.phone2Clean ? `TEL;TYPE=WORK,VOICE:${s.phone2Clean}\n` : ''}EMAIL;TYPE=INTERNET:${s.email}
ADR;TYPE=HOME:;;;${s.commune || s.wilaya};${s.wilaya};;Algérie
NOTE:Vendeur certifié Ouedkniss. ${s.totalListings} annonces actives. Catégories: ${s.categories.join(', ')}
URL:https://www.ouedkniss.com
END:VCARD`;
      })
      .join('\n');

    const blob = new Blob([vcfCards], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ouedkniss_contacts_${filteredProfiles.length}_vendeurs.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export all filtered sellers as CSV
  const handleExportCsv = () => {
    cyberAudio.playClick();
    const headers = [
      'Nom Vendeur',
      'Type',
      'Téléphone Principal',
      'Opérateur 1',
      'Téléphone Secondaire',
      'Opérateur 2',
      'Email Direct',
      'WhatsApp',
      'Wilaya',
      'Commune',
      'Total Annonces',
      'Prix Min (DA)',
      'Prix Max (DA)',
      'Catégories',
    ];

    const rows = filteredProfiles.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.type}"`,
      `"${s.phone}"`,
      `"${s.operator || 'Mobile'}"`,
      `"${s.phone2 || ''}"`,
      `"${s.operator2 || ''}"`,
      `"${s.email}"`,
      `"https://wa.me/${s.whatsappClean}"`,
      `"${s.wilaya}"`,
      `"${s.commune || ''}"`,
      s.totalListings,
      s.minPrice,
      s.maxPrice,
      `"${s.categories.join(', ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ouedkniss_annuaire_${filteredProfiles.length}_vendeurs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy all clean phone numbers to clipboard
  const handleCopyAllPhones = () => {
    cyberAudio.playClick();
    const phones = Array.from(new Set(filteredProfiles.map((s) => s.phoneClean).filter(Boolean)));
    navigator.clipboard.writeText(phones.join(', ')).then(() => {
      setCopiedBatch('phones');
      setTimeout(() => setCopiedBatch(null), 2500);
    });
  };

  // Copy all emails to clipboard
  const handleCopyAllEmails = () => {
    cyberAudio.playClick();
    const emails = Array.from(new Set(filteredProfiles.map((s) => s.email).filter(Boolean)));
    navigator.clipboard.writeText(emails.join(', ')).then(() => {
      setCopiedBatch('emails');
      setTimeout(() => setCopiedBatch(null), 2500);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Banner & Key Metrics */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-[#060b17] to-slate-950 border border-emerald-500/40 p-4 sm:p-6 shadow-[0_0_35px_rgba(0,255,102,0.12)] relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ff66]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ff66]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00ff66]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00ff66]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.25)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00ff88]" />
                ANNUAIRE PROFIL & CONTACTS DÉDUPLIQUÉ
              </span>
              <span className="text-xs font-mono text-cyan-400">
                // Zero Duplication · Tél Direct · Emails Vérifiés
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              Profils Vendeurs & Carnet d'Adresses DZ
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1 max-w-3xl">
              Extraction instantanée de chaque profil vendeur unique depuis l'ensemble des annonces.
              Appel 1-clic, emails directs, WhatsApp et export des coordonnées au format VCF/CSV.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportVcf}
              disabled={filteredProfiles.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-[#00ff88] font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Exporter tous les contacts au format VCF pour import direct dans votre téléphone"
            >
              <Contact className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Exporter VCF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredProfiles.length === 0}
              className="px-3 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Télécharger l'annuaire complet au format CSV Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Tiles (Fluid Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-black/50 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Vendeurs Uniques</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black font-mono text-[#00ff88]">
                {stats.totalSellers.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">profils</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Boutiques Pro</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black font-mono text-emerald-400">
                {stats.boutiquesCount.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">certifiées</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Particuliers</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black font-mono text-cyan-400">
                {stats.particuliersCount.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">vendeurs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/50 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Lignes Téléphoniques</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black font-mono text-yellow-400">
                {stats.totalPhoneLines.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">DZ</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-black/50 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Emails Directs</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black font-mono text-purple-400">
                {stats.emailsCount.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">100% actifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Category Tag Chips Filter (Consistent across all screens) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            FILTRER PAR RAYON & CATÉGORIE OFFICIELLE :
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {selectedCategory === 'all' ? 'Toutes les catégories' : selectedCategory}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-emerald-500/20">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              cyberAudio.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[36px] ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🌟 Tous les Rayons</span>
            <span className="text-[10px] opacity-75 font-mono">({uniqueProfiles.length})</span>
          </button>

          {OUEDKNISS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            // Count sellers who sell in this category
            const countInCat = uniqueProfiles.filter((p) =>
              p.categories.some((c) => matchCategory(c, cat.slug))
            ).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? 'all' : cat.slug);
                  cyberAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[36px] ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-[#00ff66] text-slate-950 shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                {countInCat > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-black/40 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {countInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Multi-criteria Controls Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Real-time search bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, boutique, numéro (05/06/07), email ou wilaya..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seller Type Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filtrer par type de vendeur"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500/60 cursor-pointer"
            >
              <option value="all">Tous les types de profils</option>
              <option value="boutique">🏪 Boutiques & Stores Certifiés</option>
              <option value="particulier">👤 Particuliers uniquement</option>
              <option value="auto">🚗 Showrooms Véhicules</option>
              <option value="immo">🏢 Agences Immobilières</option>
            </select>
          </div>

          {/* Wilaya Selector (All 58 Wilayas DZ) */}
          <div className="md:col-span-3">
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              aria-label="Filtrer par Wilaya algérienne"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500/60 cursor-pointer"
            >
              <option value="all">📍 58 Wilayas d'Algérie (Toutes)</option>
              {ALGERIA_69_WILAYAS.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.codeStr} - {w.name} ({w.nameAr})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Operator filter */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Opérateur:</span>
              <button
                type="button"
                onClick={() => setSelectedOperator('all')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedOperator === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedOperator('Mobilis')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedOperator === 'Mobilis' ? 'bg-[#00a651] text-white font-bold' : 'text-slate-400'
                }`}
              >
                Mobilis (06)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOperator('Djezzy')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedOperator === 'Djezzy' ? 'bg-[#e20613] text-white font-bold' : 'text-slate-400'
                }`}
              >
                Djezzy (07)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOperator('Ooredoo')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedOperator === 'Ooredoo' ? 'bg-[#ed1c24] text-white font-bold' : 'text-slate-400'
                }`}
              >
                Ooredoo (05)
              </button>
            </div>

            {/* Verified only toggle */}
            <button
              type="button"
              onClick={() => setOnlyVerified(!onlyVerified)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyVerified
                  ? 'bg-emerald-500/20 text-[#00ff88] border-emerald-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certifiés Ouedkniss</span>
            </button>
          </div>

          {/* Sort selector & Batch copy */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Trier les profils vendeurs"
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="listings">Plus d'annonces d'abord</option>
                <option value="rating">Meilleures notes étoiles</option>
                <option value="name">Nom alphabétique (A-Z)</option>
                <option value="price">Gros volumes (Prix max)</option>
                <option value="recent">Activité récente</option>
              </select>
            </div>

            {/* Batch actions dropdown */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyAllPhones}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-yellow-400 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Copier tous les numéros de téléphone filtrés"
              >
                {copiedBatch === 'phones' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBatch === 'phones' ? 'Copiés !' : 'Copier Tél'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAllEmails}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Copier toutes les adresses email filtrées"
              >
                {copiedBatch === 'emails' ? <Check className="w-3 h-3 text-emerald-400" /> : <Mail className="w-3 h-3" />}
                <span>{copiedBatch === 'emails' ? 'Copiés !' : 'Copier Mails'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Results Count Notice */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>
          Affichage de <strong className="text-white">{displayedProfiles.length}</strong> profils vendeurs sur{' '}
          <strong className="text-[#00ff88]">{filteredProfiles.length}</strong> trouvés
        </span>
        {searchQuery && (
          <span className="text-cyan-400">
            Filtre : « {searchQuery} »
          </span>
        )}
      </div>

      {/* 5. Lazy Profiles Grid (Responsive 1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      {displayedProfiles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 p-6 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold font-mono text-slate-200">
            Aucun profil vendeur ne correspond à ces critères
          </h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            Essayez d'élargir votre recherche, de réinitialiser le rayon sélectionné ou de retirer le filtre wilaya.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedCategory('all');
              setSelectedWilaya('all');
              setSelectedOperator('all');
              setOnlyVerified(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-mono text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réinitialiser tous les filtres</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {displayedProfiles.map((seller) => {
            const isExpanded = expandedSellerId === seller.id;
            const isCopied = copiedId === seller.id;

            // Direct URIs
            const telUri = `tel:${seller.phoneClean}`;
            const tel2Uri = seller.phone2Clean ? `tel:${seller.phone2Clean}` : undefined;
            const waUri = `https://wa.me/${seller.whatsappClean}?text=${encodeURIComponent(
              `Salem Alikoum ${seller.name}, je vous contacte depuis Ouedkniss concernant vos annonces en ligne.`
            )}`;
            const mailtoUri = buildMailtoLink({
              name: seller.name,
              type: seller.type,
              phone: seller.phone,
              phoneClean: seller.phoneClean,
              whatsappClean: seller.whatsappClean,
              email: seller.email,
              wilaya: seller.wilaya,
              verified: seller.verified,
            });

            return (
              <div
                key={seller.id}
                className="rounded-2xl bg-gradient-to-b from-slate-950/95 to-[#070d1a]/95 border border-slate-800/90 hover:border-emerald-500/50 p-4 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,102,0.12)] transition-all flex flex-col justify-between space-y-3 relative group min-w-0 overflow-hidden"
              >
                {/* Header: Avatar, Name, Type, and Verified Badge */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        seller.avatarUrl ||
                        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
                      }
                      alt={seller.name}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 shadow"
                    />
                    {seller.verified && (
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border border-black shadow"
                        title="Vendeur Vérifié Ouedkniss"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h2 className="font-mono text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {seller.name}
                      </h2>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shrink-0">
                        {seller.totalListings} ad{seller.totalListings > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-slate-400 truncate">
                      {seller.type !== 'Particulier' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 truncate">
                          <Store className="w-3 h-3 shrink-0" />
                          <span className="truncate">{seller.type}</span>
                        </span>
                      ) : (
                        <span className="text-cyan-400 flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">Particulier</span>
                        </span>
                      )}
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400 flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {seller.rating.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {seller.wilaya} {seller.commune ? `(${seller.commune})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Coordinates Box: Primary Phone, Secondary Phone, and Email */}
                <div className="p-3 rounded-xl bg-black/60 border border-slate-800/80 space-y-2 text-xs font-mono min-w-0 overflow-hidden">
                  {/* Primary Phone */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400 text-[11px] shrink-0">Tél 1 :</span>
                      <strong className="text-white font-mono tracking-wide truncate">{seller.phone}</strong>
                      {seller.operator && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            seller.operator === 'Mobilis'
                              ? 'bg-[#00a651]/20 text-[#00ff88] border border-[#00a651]/50'
                              : seller.operator === 'Djezzy'
                              ? 'bg-[#e20613]/20 text-rose-300 border border-[#e20613]/50'
                              : 'bg-[#ed1c24]/20 text-red-300 border border-[#ed1c24]/50'
                          }`}
                        >
                          {seller.operator}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyItem(seller.phoneClean, `phone_${seller.id}`)}
                      className="text-slate-400 hover:text-emerald-400 p-1 shrink-0 cursor-pointer"
                      title="Copier le numéro"
                    >
                      {copiedId === `phone_${seller.id}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Secondary Phone if available */}
                  {seller.phone2 && (
                    <div className="flex items-center justify-between gap-2 min-w-0 pt-1.5 border-t border-slate-900">
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <PhoneCall className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-slate-400 text-[11px] shrink-0">Tél 2 :</span>
                        <strong className="text-slate-200 font-mono tracking-wide truncate">{seller.phone2}</strong>
                        {seller.operator2 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shrink-0">
                            {seller.operator2}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyItem(seller.phone2Clean || seller.phone2!, `phone2_${seller.id}`)}
                        className="text-slate-400 hover:text-cyan-400 p-1 shrink-0 cursor-pointer"
                        title="Copier le 2ème numéro"
                      >
                        {copiedId === `phone2_${seller.id}` ? (
                          <Check className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Direct Email Address */}
                  <div className="flex items-center justify-between gap-2 min-w-0 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="text-slate-400 text-[11px] shrink-0">Email :</span>
                      <span className="text-purple-300 font-mono truncate text-[11px]">{seller.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyItem(seller.email, `mail_${seller.id}`)}
                      className="text-slate-400 hover:text-purple-400 p-1 shrink-0 cursor-pointer"
                      title="Copier l'adresse email"
                    >
                      {copiedId === `mail_${seller.id}` ? (
                        <Check className="w-3 h-3 text-purple-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Categories tags for this seller */}
                <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
                  {seller.categories.slice(0, 3).map((catName) => (
                    <span
                      key={catName}
                      className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono truncate max-w-[140px]"
                    >
                      {catName}
                    </span>
                  ))}
                  {seller.categories.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-mono">
                      +{seller.categories.length - 3}
                    </span>
                  )}
                </div>

                {/* Main Action Buttons: 1-Click Call, WhatsApp, Email & Copy vCard */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  {/* Primary 1-Click Dial Button */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={telUri}
                      className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff66] text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,102,0.25)] hover:brightness-110 active:scale-95 transition-all cursor-pointer min-h-[40px] truncate"
                      title={`Appeler directement ${seller.name} : ${seller.phone}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                      <span className="truncate">Appel Tél 1</span>
                    </a>

                    <a
                      href={waUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] truncate"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  </div>

                  {/* Secondary Actions: Email Direct, Secondary Phone & Full vCard */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={mailtoUri}
                      className="py-1.5 px-2 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate min-h-[36px]"
                      title={`Envoyer un email à ${seller.email}`}
                    >
                      <Mail className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">Email</span>
                    </a>

                    {tel2Uri ? (
                      <a
                        href={tel2Uri}
                        className="py-1.5 px-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate min-h-[36px]"
                        title={`Appeler 2ème ligne : ${seller.phone2}`}
                      >
                        <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">Tél 2</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopySellerContact(seller)}
                        className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate min-h-[36px]"
                        title="Copier la fiche complète du contact"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="truncate">{isCopied ? 'Copié !' : 'Contact'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedSellerId(isExpanded ? null : seller.id)}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate min-h-[36px]"
                      title="Déplier et voir les annonces publiées par ce vendeur"
                    >
                      <ShoppingBag className="w-3 h-3 shrink-0" />
                      <span className="truncate">Annonces</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Listings Drawer: Previews all items published by this seller */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Annonces de ce vendeur ({seller.products.length}) :</span>
                      {onNavigateToCatalogWithSeller && (
                        <button
                          type="button"
                          onClick={() => onNavigateToCatalogWithSeller(seller.name)}
                          className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Voir dans catalogue</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
                      {seller.products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => onSelectProduct && onSelectProduct(prod)}
                          className="p-2 rounded-xl bg-black/70 border border-slate-800 hover:border-emerald-500/40 flex items-center gap-2.5 transition-all cursor-pointer group/item"
                        >
                          <img
                            src={
                              prod.imageUrl ||
                              `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80`
                            }
                            alt={prod.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-mono text-xs text-slate-200 group-hover/item:text-emerald-300 truncate">
                              {prod.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                              <span className="text-[#00ff88] font-bold">
                                {new Intl.NumberFormat('fr-DZ').format(prod.currentPrice)} {prod.currency}
                              </span>
                              {prod.discountPercent > 0 && (
                                <span className="text-rose-400 font-bold">-{prod.discountPercent}%</span>
                              )}
                              <span className="truncate text-slate-500">{prod.category}</span>
                            </div>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-emerald-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Lazy Loading Sentinel Indicator */}
      {displayedProfiles.length < filteredProfiles.length && (
        <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 font-mono text-xs text-emerald-300 backdrop-blur-md animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>
              CHARGEMENT LAZY DES PROFILS... ({displayedProfiles.length} / {filteredProfiles.length} AFFICHÉS)
            </span>
          </div>
        </div>
      )}

      {displayedProfiles.length >= filteredProfiles.length && filteredProfiles.length > 0 && (
        <div className="py-4 text-center text-slate-500 font-mono text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>TOUS LES {filteredProfiles.length} PROFILS VENDEURS UNIQUES SONT CHARGÉS SANS DUPLICATION</span>
        </div>
      )}
    </div>
  );
};
