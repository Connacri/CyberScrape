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
