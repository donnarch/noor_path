/* Minimal IndexedDB key-value store for larger local data (for example saved recordings). */
const DB = "noorpath", STORE = "blobs";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const q = fn(db.transaction(STORE, mode).objectStore(STORE));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
export const idbPut = (k: string, v: Blob | string) => run("readwrite", (s) => s.put(v, k));
export const idbGet = <T = Blob | string>(k: string) => run<T | undefined>("readonly", (s) => s.get(k) as IDBRequest<T | undefined>);
export const idbDelete = (k: string) => run("readwrite", (s) => s.delete(k));
export const idbClear = () => run("readwrite", (s) => s.clear());
