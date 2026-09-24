const DB_NAME = 'api_os_history_db';
const DB_VERSION = 2;
const STORE_NAME = 'history';
const MAX_HISTORY_RECORDS = 1000;

let dbInstance = null;
let dbInitPromise = null;
let migrationDone = false;

/**
 * Initializes and returns the IndexedDB database instance for request history.
 */
export function initHistoryDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      console.warn('API.OS: IndexedDB is not supported in this environment.');
      return resolve(null);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('method', 'method', { unique: false });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('status', 'response.status', { unique: false });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = event.target.result;

      // Handle accidental connection closing
      dbInstance.onclose = () => {
        dbInstance = null;
        dbInitPromise = null;
      };

      // Perform one-time migration from localStorage if needed
      if (!migrationDone) {
        migrationDone = true;
        try {
          await migrateFromLocalStorage(dbInstance);
        } catch (err) {
          console.error('API.OS: Error during localStorage to IndexedDB migration:', err);
        }
      }

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('API.OS: Failed to open IndexedDB history database:', event.target.error);
      dbInitPromise = null;
      reject(event.target.error);
    };
  });

  return dbInitPromise;
}

/**
 * Safely sanitizes arbitrary objects for Structured Clone algorithm in IndexedDB.
 */
function safeClone(data, fallback = null) {
  if (data === undefined) return fallback;
  if (data === null || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) return data;

  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    if (typeof data.toString === 'function') {
      return data.toString();
    }
    return String(data);
  }
}

/**
 * Migrates existing history from localStorage into IndexedDB seamlessly.
 */
async function migrateFromLocalStorage(db) {
  try {
    const rawLocalHistory = localStorage.getItem('api_os_history');
    if (!rawLocalHistory) return;

    const parsedHistory = JSON.parse(rawLocalHistory);
    if (!Array.isArray(parsedHistory) || parsedHistory.length === 0) {
      return;
    }

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const item of parsedHistory) {
      if (item) {
        const record = {
          ...item,
          id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: item.timestamp || new Date().toISOString()
        };
        store.put(record);
      }
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    localStorage.removeItem('api_os_history');
    console.info(`API.OS: Migrated ${parsedHistory.length} history records from localStorage to IndexedDB.`);
  } catch (err) {
    console.error('API.OS: Failed to migrate history from localStorage:', err);
  }
}

/**
 * Saves an executed request and response snapshot into IndexedDB.
 */
export const saveToHistory = async (url, method, currentRequest = {}, currentResponse = {}) => {
  try {
    const db = await initHistoryDB();
    if (!db) return;

    const rawData = currentResponse.data !== undefined ? currentResponse.data : currentResponse.rawData;
    const safeData = safeClone(rawData, '');

    const newLog = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      method: method || 'GET',
      url: url || '',
      request: {
        body: safeClone(currentRequest.body, ''),
        contentType: currentRequest.contentType || 'application/json',
        headers: safeClone(currentRequest.headers, []),
        query: safeClone(currentRequest.query, [])
      },
      response: {
        status: currentResponse.status || '200',
        rawData: safeData,
        headers: safeClone(currentResponse.headers, {}),
        time: currentResponse.time || '0 ms',
        length: currentResponse.length || '0 B'
      },
      category: currentResponse.category || 'TEXT',
      type: currentResponse.type || 'JSON',
      size: currentResponse.length || (typeof rawData === 'string' ? `${rawData.length} B` : '0 B')
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(newLog);

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    // Notify all active workbench components of history update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api_os_history_updated', { detail: newLog }));
    }

    // Periodically prune older entries beyond MAX_HISTORY_RECORDS
    pruneHistory(db).catch(err => console.warn('API.OS: Prune history error:', err));
  } catch (error) {
    console.error('API.OS: IndexedDB history save failed:', error);
  }
};

/**
 * Retrieves history records sorted by timestamp descending.
 * Supports limit, search query, and status filtering.
 */
export const getHistory = async ({ limit = 500, query = '', filter = 'ALL' } = {}) => {
  try {
    const db = await initHistoryDB();
    if (!db) {
      const fallback = JSON.parse(localStorage.getItem('api_os_history')) || [];
      return fallback.slice(0, limit);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      const lowerQuery = query ? query.toLowerCase() : '';

      req.onsuccess = () => {
        let records = req.result || [];

        // Sort descending by timestamp
        records.sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA;
        });

        if (filter !== 'ALL') {
          records = records.filter(log => {
            const statusNum = parseInt(log.response?.status, 10);
            if (filter === 'SUCCESS') return statusNum >= 200 && statusNum < 300;
            if (filter === 'WARNING') return statusNum >= 400 && statusNum < 500;
            if (filter === 'FAILED') return statusNum >= 400;
            if (filter === 'ERROR') return statusNum >= 500;
            return true;
          });
        }

        if (lowerQuery) {
          records = records.filter(log => {
            const matchUrl = log.url && log.url.toLowerCase().includes(lowerQuery);
            const matchMethod = log.method && log.method.toLowerCase().includes(lowerQuery);
            return matchUrl || matchMethod;
          });
        }

        resolve(records.slice(0, limit));
      };

      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('API.OS: Failed to retrieve history from IndexedDB:', error);
    return [];
  }
};

/**
 * Deletes an individual history item by its ID.
 */
export const deleteHistoryItem = async (id) => {
  try {
    const db = await initHistoryDB();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api_os_history_updated'));
        }
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('API.OS: Failed to delete history item from IndexedDB:', error);
    return false;
  }
};

/**
 * Purges all records from the request history database.
 */
export const clearHistory = async () => {
  try {
    const db = await initHistoryDB();
    if (!db) {
      localStorage.removeItem('api_os_history');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api_os_history_cleared'));
      }
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        localStorage.removeItem('api_os_history');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api_os_history_cleared'));
        }
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('API.OS: Failed to clear history in IndexedDB:', error);
    return false;
  }
};

/**
 * Computes telemetry stats across all historical records for MatrixStats and Overview.
 */
export const getHistoryStats = async () => {
  try {
    const db = await initHistoryDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        const total = records.length;
        let success = 0;
        let client_errors = 0;
        let server_errors = 0;
        let rate_limited = 0;
        let bytes_transferred = 0;
        let total_compute_time_ms = 0;

        for (const log of records) {
          const s = parseInt(log.response?.status, 10) || 200;
          if (s >= 200 && s < 400) success++;
          else if (s === 429) rate_limited++;
          else if (s >= 400 && s < 500) client_errors++;
          else if (s >= 500) server_errors++;

          bytes_transferred += (log.response?.length || log.size || 512);

          const timeVal = typeof log.response?.time === 'string'
            ? parseFloat(log.response.time) || 45
            : (log.response?.time || log.time || 45);
          total_compute_time_ms += timeVal;
        }

        resolve({
          total,
          success,
          rate_limited,
          client_errors,
          server_errors,
          bytes_transferred,
          total_compute_time_ms,
          records
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('API.OS: Failed to compute history stats:', error);
    return null;
  }
};

/**
 * Calculates the exact byte size of the 'history' table in IndexedDB.
 * Returns { bytes: number, formatted: string, count: number }
 */
export const getHistoryTableSize = async () => {
  try {
    const db = await initHistoryDB();
    if (!db) return { bytes: 0, formatted: '0.00 B', count: 0 };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();

      let totalBytes = 0;
      let count = 0;
      const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const val = cursor.value;
          if (val instanceof Blob) {
            totalBytes += val.size;
          } else if (val instanceof ArrayBuffer) {
            totalBytes += val.byteLength;
          } else if (encoder) {
            totalBytes += encoder.encode(JSON.stringify(val)).length;
          } else {
            totalBytes += JSON.stringify(val).length;
          }
          count++;
          cursor.continue();
        } else {
          resolve({
            bytes: totalBytes,
            formatted: formatStorageBytes(totalBytes),
            count
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('API.OS: Failed to calculate history table size:', error);
    return { bytes: 0, formatted: '0.00 B', count: 0 };
  }
};

function formatStorageBytes(bytes) {
  if (!bytes || bytes === 0) return '0.00 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Internal helper to prune records exceeding MAX_HISTORY_RECORDS (FIFO).
 */
async function pruneHistory(db) {
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      if (count > MAX_HISTORY_RECORDS) {
        const excess = count - MAX_HISTORY_RECORDS;
        const index = store.index('timestamp');
        // Delete oldest records ('next' direction = oldest first)
        let deleted = 0;
        const cursorRequest = index.openCursor(null, 'next');

        cursorRequest.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor && deleted < excess) {
            cursor.delete();
            deleted++;
            cursor.continue();
          }
        };
      }
    };
  } catch (err) {
    console.warn('API.OS: Pruning failed:', err);
  }
}

/**
 * Audits all application IndexedDB tables (api_os_history_db and lists).
 * Returns real size telemetry for both tables to prevent confusion.
 */
export const getAllDatabaseStats = async () => {
  const historyStats = await getHistoryTableSize();
  let listsStats = { bytes: 0, formatted: '0.00 B', count: 0 };

  try {
    if (typeof indexedDB !== 'undefined') {
      const listsDb = await new Promise((res, rej) => {
        const req = indexedDB.open('lists', 1);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

      if (listsDb.objectStoreNames.contains('jsonList')) {
        listsStats = await new Promise((res) => {
          const tx = listsDb.transaction('jsonList', 'readonly');
          const store = tx.objectStore('jsonList');
          const cursorReq = store.openCursor();
          let bytes = 0;
          let count = 0;
          const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

          cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              const val = cursor.value;
              if (val instanceof Blob) {
                bytes += val.size;
              } else if (val instanceof ArrayBuffer) {
                bytes += val.byteLength;
              } else if (encoder) {
                bytes += encoder.encode(JSON.stringify(val)).length;
              } else {
                bytes += JSON.stringify(val).length;
              }
              count++;
              cursor.continue();
            } else {
              res({ bytes, formatted: formatStorageBytes(bytes), count });
            }
          };
          cursorReq.onerror = () => res({ bytes: 0, formatted: '0.00 B', count: 0 });
        });
      }
    }
  } catch (err) {
    // lists DB might not be initialized yet
  }

  const totalBytes = historyStats.bytes + listsStats.bytes;
  return {
    history: historyStats,
    lists: listsStats,
    totalBytes,
    totalFormatted: formatStorageBytes(totalBytes)
  };
};