/**
 * Cooking Temperature Draft Service
 * 
 * Safely persists and manages in-progress Cooking Temperature batches locally on the line tablet/browser
 * using localStorage. Ensures drafts survive browser tab closures, reloads, or device sleep.
 */

const DRAFT_PREFIX = 'chef2comply:cooking_temperature:draft:';

/**
 * Check if localStorage is supported and accessible
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__c2c_draft_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Build a structured localStorage key for a cooking temperature draft
 * 
 * @param {Object} options - { tenant_id, branch_id, draft_id }
 * @returns {string} Fully qualified localStorage key
 */
export const buildDraftKey = ({ tenant_id = 'any', branch_id = 'any', draft_id = null } = {}) => {
  const safeDraftId = draft_id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return `${DRAFT_PREFIX}${tenant_id}:${branch_id}:${safeDraftId}`;
};

/**
 * Save draft data to localStorage
 * 
 * @param {string} draftKey - The unique draft key
 * @param {Object} data - Form data and metadata
 * @returns {boolean} True if saved successfully, false otherwise
 */
export const saveDraft = (draftKey, data) => {
  if (!isLocalStorageAvailable() || !draftKey) return false;

  try {
    const payload = {
      draftKey,
      module: 'cooking_temperature',
      tenant_id: data?.tenant_id ?? null,
      branch_id: data?.branch_id ?? null,
      savedAt: new Date().toISOString(),
      formData: data?.formData ?? data,
    };

    window.localStorage.setItem(draftKey, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('[cookingDraftService] Failed to save draft to localStorage:', err);
    return false;
  }
};

/**
 * Load a draft from localStorage
 * 
 * @param {string} draftKey - The unique draft key
 * @returns {Object|null} The parsed draft payload or null if not found/corrupted
 */
export const loadDraft = (draftKey) => {
  if (!isLocalStorageAvailable() || !draftKey) return null;

  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch (err) {
    console.error('[cookingDraftService] Failed to load/parse draft:', err);
    return null;
  }
};

/**
 * Delete a specific draft from localStorage
 * 
 * @param {string} draftKey - The unique draft key to remove
 * @returns {boolean} True if removed successfully
 */
export const deleteDraft = (draftKey) => {
  if (!isLocalStorageAvailable() || !draftKey) return false;

  try {
    window.localStorage.removeItem(draftKey);
    return true;
  } catch (err) {
    console.error('[cookingDraftService] Failed to delete draft:', err);
    return false;
  }
};

/**
 * List all cooking temperature drafts stored locally
 * 
 * @param {Object} [filter] - Optional filter by { tenant_id, branch_id }
 * @returns {Array<Object>} List of draft objects sorted by savedAt desc
 */
export const listDrafts = (filter = {}) => {
  if (!isLocalStorageAvailable()) return [];

  const drafts = [];

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.module === 'cooking_temperature') {
              // Apply optional tenant/branch filter
              if (filter.tenant_id && parsed.tenant_id && String(parsed.tenant_id) !== String(filter.tenant_id)) {
                continue;
              }
              if (filter.branch_id && parsed.branch_id && String(parsed.branch_id) !== String(filter.branch_id)) {
                continue;
              }
              drafts.push(parsed);
            }
          }
        } catch (e) {
          // Ignore invalid/corrupted single item
        }
      }
    }

    // Sort newest first
    drafts.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  } catch (err) {
    console.error('[cookingDraftService] Failed to list drafts:', err);
  }

  return drafts;
};

/**
 * Clear drafts older than specified days
 * 
 * @param {number} [days=14] - Retention threshold in days
 * @returns {number} Number of deleted old drafts
 */
export const clearOldDrafts = (days = 14) => {
  if (!isLocalStorageAvailable()) return 0;

  let deletedCount = 0;
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const keysToRemove = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const savedTime = new Date(parsed.savedAt || 0).getTime();
            if (savedTime && savedTime < cutoffTime) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Corrupted draft, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => {
      window.localStorage.removeItem(k);
      deletedCount++;
    });
  } catch (err) {
    console.error('[cookingDraftService] Failed during clearOldDrafts:', err);
  }

  return deletedCount;
};

export default {
  isLocalStorageAvailable,
  buildDraftKey,
  saveDraft,
  loadDraft,
  deleteDraft,
  listDrafts,
  clearOldDrafts,
};
