export interface PricePoint {
  date: string;
  price: number;
  note?: string;
}

export interface SellerInfo {
  name: string;
  type: 'Particulier' | 'Boutique / Store Certifié' | 'Agence Immobilière' | 'Showroom Auto';
  phone: string; // Formatted Algerian number, e.g. "0550 12 34 56"
  phoneClean: string; // e.g. "0550123456" for direct tel:
  whatsappClean: string; // e.g. "213550123456" for https://wa.me/213550123456
  wilaya: string;
  commune?: string;
  memberSince?: string;
  rating?: number;
  reviewsCount?: number;
  responseTime?: string;
  verified: boolean;
  avatarUrl?: string;
  storeName?: string;
  operator?: 'Mobilis' | 'Djezzy' | 'Ooredoo';
}

export interface ScrapedProduct {
  id: string;
  title: string;
  brand?: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockLevel: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  imageUrl: string;
  images?: string[]; // Multiple photos for announcement gallery
  productUrl: string;
  sourceDomain: string;
  scrapedAt: string;
  lastUpdated: string;
  priceHistory: PricePoint[];
  sku?: string;
  specs?: Record<string, string>;
  seller?: SellerInfo; // Publisher / advertiser details
  description?: string; // Full announcement description text
  publishedDate?: string; // e.g. "Hier à 19:40"
  deliveryAvailable?: boolean;
  priceType?: 'Fixe' | 'Négociable' | 'Offert' | 'Sur devis';
  aiConfidence: number; // e.g. 98.5%
  syncedToSupabase: boolean;
  matrixHash?: string;
}

export interface ScrapeLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'vacuum' | 'success' | 'cyber';
  message: string;
  hex?: string;
}

export interface CrawlerState {
  scrollY: number;
  maxScroll: number;
  activeSelector: string;
  currentElementFound: string;
  domNodesInspected: number;
  tokensProcessed: number;
  speedKbps: number;
}

export interface ScrapeJob {
  jobId: string;
  targetUrl: string;
  status: 'idle' | 'connecting' | 'scanning' | 'aspirating' | 'completed' | 'error';
  progress: number;
  itemsFound: number;
  pagesVisited: number;
  dataTransferKb: number;
  currentDomNode: string;
  aiAgentAction: string;
  error?: string;
  logs: ScrapeLog[];
  crawlerState: CrawlerState;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  autoSync: boolean;
  lastSyncTime?: string;
}

export interface AutoUpdateConfig {
  enabled: boolean;
  intervalMinutes: number; // 1, 5, 15, 60
  lastRun?: string;
  nextRun?: string;
}

export interface ScrapingQueueItem {
  id: string;
  url: string;
  title: string;
  category?: string;
  status: 'queued' | 'active' | 'completed' | 'error';
  itemsExtracted?: number;
  addedAt: string;
  error?: string;
}
