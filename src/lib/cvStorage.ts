import type { CVData } from '../types';

const DB_NAME = 'cvtool-db';
const DB_VERSION = 1;
const STORE_NAME = 'cv-data';

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // CV Data Store
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveCV(cvData: CVData): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Speichern mit fester ID (nur ein CV pro User)
    const dataWithId = { ...cvData, id: 'current-cv' };
    const request = store.put(dataWithId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadCV(): Promise<CVData | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('current-cv');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (request.result) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...cvData } = request.result;
        resolve(cvData as CVData);
      } else {
        resolve(null);
      }
    };
  });
}

export async function clearCV(): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('current-cv');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
