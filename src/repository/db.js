import { jsonProperties } from "../assets/jsonProperties";

const MAX_KEYS = 800;
let db = null;
let cacheList = null;
const jp = new Set(jsonProperties);

// 1. Recursive Key Extractor & Counter
function extractUniqueKeys(data, keySet = new Set()) {
    if (data === null || typeof data !== "object") return keySet;

    for (let key of Object.keys(data)) {
        keySet.add(key);
        extractUniqueKeys(data[key], keySet);
    }
    return keySet;
}

// 2. Self-Learning Engine Handler
export async function saveLearnedkeys(payload) {
    const uniqueKeys = extractUniqueKeys(payload);
    if (uniqueKeys.size === 0) return;

    await initDB();
    await readJSONList();

    const freqMap = new Map(cacheList);

    // Increment each unique key by 1, no matter how many times it repeated in arrays
    for (const key of uniqueKeys) {
        if (!jp.has(key)) {
            const existingCount = freqMap.get(key) || 0;
            freqMap.set(key, existingCount + 1);
        }
    }
    let sortedArray = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);

    // Enforce the 800 limit using frequency sorting
    if (freqMap.size > MAX_KEYS) {
        sortedArray = sortedArray.slice(0, MAX_KEYS);
    }

    await saveJSONList(sortedArray);
}

// 3. Database Initialization
function initDB() {
    if (db) return Promise.resolve(db);
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("lists", 1);
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains("jsonList")) {
                db.createObjectStore("jsonList", { keyPath: "key" });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onerror = (e) => {
            reject(e.target.error);
        };
    });
}

// 4. Save to IndexedDB
export async function saveJSONList(list) {
    await initDB();
    if (!cacheList) await readJSONList();
    
    // If it's a frequency map array, we assign directly; otherwise merge
    cacheList = list;

    return new Promise((resolve, reject) => {
        const t = db.transaction("jsonList", "readwrite");
        const store = t.objectStore('jsonList');
        const r = store.put({
            key: "list",
            value: cacheList
        });
        r.onsuccess = () => resolve(true);
        r.onerror = () => reject(r.error);
    });
}

// 5. Read from IndexedDB
export async function readJSONList(forcedUpdate = false) {
    await initDB();
    if (!forcedUpdate && cacheList !== null) {
        return cacheList;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("jsonList", "readonly");
        const store = transaction.objectStore("jsonList");
        const request = store.get("list");
      
        request.onsuccess = () => {
            const record = request.result;
            if (record && Array.isArray(record.value)) {
                cacheList = record.value;
                resolve(cacheList);
            } else {
                cacheList = [];
                resolve(cacheList);
            }
        };
        request.onerror = () => { reject(request.error); };
    });
}