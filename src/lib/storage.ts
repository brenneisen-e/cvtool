import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { UploadedFile, InterviewState, CVData } from '../types';

interface CVOptimizerDB extends DBSchema {
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      type: UploadedFile['type'];
      data: ArrayBuffer;
      content?: string;
      extractedData?: UploadedFile['extractedData'];
      createdAt: number;
    };
  };
  state: {
    key: string;
    value: {
      key: string;
      data: InterviewState | CVData | number;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'cv-optimizer-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CVOptimizerDB> | null = null;

async function getDB(): Promise<IDBPDatabase<CVOptimizerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CVOptimizerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

export async function saveFile(file: UploadedFile): Promise<void> {
  const db = await getDB();
  const arrayBuffer = await file.file.arrayBuffer();

  await db.put('files', {
    id: file.id,
    name: file.name,
    type: file.type,
    data: arrayBuffer,
    content: file.content,
    extractedData: file.extractedData,
    createdAt: Date.now(),
  });
}

export async function getFile(id: string): Promise<UploadedFile | null> {
  const db = await getDB();
  const stored = await db.get('files', id);

  if (!stored) return null;

  const blob = new Blob([stored.data]);
  const file = new File([blob], stored.name);

  return {
    id: stored.id,
    name: stored.name,
    type: stored.type,
    file,
    content: stored.content,
    extractedData: stored.extractedData,
  };
}

export async function getAllFiles(): Promise<UploadedFile[]> {
  const db = await getDB();
  const stored = await db.getAll('files');

  return stored.map((s) => {
    const blob = new Blob([s.data]);
    const file = new File([blob], s.name);
    return {
      id: s.id,
      name: s.name,
      type: s.type,
      file,
      content: s.content,
      extractedData: s.extractedData,
    };
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('files', id);
}

export async function clearAllFiles(): Promise<void> {
  const db = await getDB();
  await db.clear('files');
}

export async function saveState<T extends InterviewState | CVData | number>(
  key: string,
  data: T
): Promise<void> {
  const db = await getDB();
  await db.put('state', {
    key,
    data,
    updatedAt: Date.now(),
  });
}

export async function getState<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const stored = await db.get('state', key);
  return stored ? (stored.data as T) : null;
}

export async function clearState(): Promise<void> {
  const db = await getDB();
  await db.clear('state');
}

export async function clearAll(): Promise<void> {
  await clearAllFiles();
  await clearState();
}
