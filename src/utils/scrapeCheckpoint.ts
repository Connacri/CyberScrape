/**
 * CYBER-VACUUM // Scrape Checkpoint & Resumption Manager
 * Tracks sweep session position, category progress, page numbers, and completed categories
 * so scraping never restarts from zero and seamlessly resumes where it was interrupted.
 */

export interface ScrapeSweepCheckpoint {
  categoryIndex: number;
  categorySlug: string;
  categoryName: string;
  currentPage: number;
  totalSweepItems: number;
  completedCategorySlugs: string[];
  pagesPerCategory: number; // 0 = illimité
  status: 'running' | 'paused' | 'stopped' | 'completed';
  timestamp: number;
}

export interface CategoryPageProgress {
  [categoryKey: string]: {
    lastPage: number;
    totalExtracted: number;
    updatedAt: number;
  };
}

const SWEEP_CHECKPOINT_KEY = 'cyber_vacuum_sweep_checkpoint_v2';
const CATEGORY_PROGRESS_KEY = 'cyber_vacuum_category_progress_v2';

export function saveSweepCheckpoint(checkpoint: ScrapeSweepCheckpoint): void {
  try {
    localStorage.setItem(SWEEP_CHECKPOINT_KEY, JSON.stringify(checkpoint));
  } catch (err) {
    console.warn('[Checkpoint] Failed to save sweep checkpoint to localStorage', err);
  }
}

export function loadSweepCheckpoint(): ScrapeSweepCheckpoint | null {
  try {
    const raw = localStorage.getItem(SWEEP_CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.categoryIndex === 'number' && typeof parsed.currentPage === 'number') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[Checkpoint] Failed to parse sweep checkpoint', err);
    return null;
  }
}

export function clearSweepCheckpoint(): void {
  try {
    localStorage.removeItem(SWEEP_CHECKPOINT_KEY);
  } catch (err) {
    console.warn('[Checkpoint] Failed to clear sweep checkpoint', err);
  }
}

export function saveCategoryProgress(categoryKey: string, lastPage: number, totalExtracted: number): void {
  try {
    const all = loadAllCategoryProgress();
    all[categoryKey] = {
      lastPage,
      totalExtracted: (all[categoryKey]?.totalExtracted || 0) + totalExtracted,
      updatedAt: Date.now(),
    };
    localStorage.setItem(CATEGORY_PROGRESS_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('[Checkpoint] Failed to save category progress', err);
  }
}

export function loadAllCategoryProgress(): CategoryPageProgress {
  try {
    const raw = localStorage.getItem(CATEGORY_PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function getCategoryResumePage(categoryKey: string): number {
  const all = loadAllCategoryProgress();
  const entry = all[categoryKey];
  return entry ? entry.lastPage + 1 : 1;
}

export function resetCategoryProgress(categoryKey?: string): void {
  try {
    if (categoryKey) {
      const all = loadAllCategoryProgress();
      delete all[categoryKey];
      localStorage.setItem(CATEGORY_PROGRESS_KEY, JSON.stringify(all));
    } else {
      localStorage.removeItem(CATEGORY_PROGRESS_KEY);
    }
  } catch (err) {
    console.warn('[Checkpoint] Failed to reset category progress', err);
  }
}

// ========================================================
// PERSISTENT SCRAPED CATEGORIES REGISTRY
// Ensures categories already scraped remain green (vert) forever
// even when the user reopens the app or web page, or purges memory.
// ========================================================
const SCRAPED_CATEGORIES_REGISTRY_KEY = 'cyber_vacuum_scraped_categories_registry_v1';

export function getScrapedCategoriesRegistry(): string[] {
  try {
    const raw = localStorage.getItem(SCRAPED_CATEGORIES_REGISTRY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function markCategoryAsScraped(identifier: string): void {
  if (!identifier) return;
  try {
    const normalized = identifier.trim().toLowerCase();
    const current = getScrapedCategoriesRegistry();
    if (!current.includes(normalized)) {
      current.push(normalized);
      localStorage.setItem(SCRAPED_CATEGORIES_REGISTRY_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('[Checkpoint] Failed to mark category as scraped', err);
  }
}

export function markCategoriesBatchAsScraped(identifiers: string[]): void {
  if (!identifiers || identifiers.length === 0) return;
  try {
    const current = new Set(getScrapedCategoriesRegistry());
    for (const id of identifiers) {
      if (id && typeof id === 'string') {
        current.add(id.trim().toLowerCase());
      }
    }
    localStorage.setItem(SCRAPED_CATEGORIES_REGISTRY_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('[Checkpoint] Failed to mark batch categories as scraped', err);
  }
}

export function isCategoryAlreadyScraped(identifier: string): boolean {
  if (!identifier) return false;
  const list = getScrapedCategoriesRegistry();
  const normalized = identifier.trim().toLowerCase();
  return list.includes(normalized);
}

export function resetScrapedCategoriesRegistry(): void {
  try {
    localStorage.removeItem(SCRAPED_CATEGORIES_REGISTRY_KEY);
  } catch {
    // ignore
  }
}

