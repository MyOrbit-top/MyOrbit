// ============================================
// MyOrbit - IndexedDB Cache Layer
// ============================================

const DB_NAME = 'MyOrbitCache'
const DB_VERSION = 1

interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  ttl: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('rss_cache')) {
        db.createObjectStore('rss_cache', { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        if (entry && Date.now() - entry.timestamp < entry.ttl) {
          resolve(entry.data)
        } else {
          // 过期或不存在，直接返回 null
          // 不删除，避免 read-only 事务报错
          resolve(null)
        }
      }

      request.onerror = () => {
        resolve(null)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch {
    return null
  }
}

async function setToStore<T>(storeName: string, key: string, data: T, ttl: number = 3600000): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      }
      store.put(entry)
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        resolve()
      }
    })
  } catch {
    // Silently fail
  }
}

// --- RSS Cache ---
export async function getRSSCache(feedUrl: string): Promise<any[] | null> {
  return getFromStore<any[]>('rss_cache', feedUrl)
}

export async function setRSSCache(feedUrl: string, items: any[]): Promise<void> {
  return setToStore('rss_cache', feedUrl, items, 1800000) // 30 min TTL
}

export const db = {
  getRSSCache,
  setRSSCache,
}
