// Saved checks and their screenshots live in IndexedDB on this device only.
import type { SavedCheck } from './log';

export interface StoredCheck extends SavedCheck {
  mineImage?: Blob;
  cleanImage?: Blob;
}

const DB = 'who-pays-more';
const STORE = 'checks';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const saveCheck = (c: StoredCheck) => run('readwrite', (s) => s.put(c));
export const deleteCheck = (id: string) => run('readwrite', (s) => s.delete(id));
export const allChecks = () => run<StoredCheck[]>('readonly', (s) => s.getAll());
