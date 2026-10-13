import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
export type StoredAudio = string | Blob;
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('round-pro-audio-v2', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function databaseRequest<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction('files', mode), request = operation(transaction.objectStore('files'));
    let result: T;
    request.onsuccess = () => { result = request.result as T; };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || request.error);
    transaction.onabort = () => reject(transaction.error || new Error('音频缓存写入失败'));
  });
}
let initialized = false;
function nativeDirectory() {
  const directory = new Directory(Paths.document, 'round-pro-audio-v2');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  if (!initialized) {
    initialized = true;
    // Only our interrupted writes are swept, before the first producer can start.
    for (const file of directory.list()) if (file instanceof File && /^sound2-.*\.partial-/.test(file.name)) file.delete();
  }
  return directory;
}
const validKey = (key: string) => /^sound2-pcm8-11025-p\d+-w\d+-s\d+-r\d+-l[01]-v[01]-e[01]$/.test(key);
export const audioStore = {
  async read(key: string): Promise<StoredAudio | null> {
    if (!validKey(key)) throw new Error('Invalid audio cache key');
    if (Platform.OS === 'web') return await databaseRequest<Blob | undefined>('readonly', store => store.get(key)) ?? null;
    const file = new File(nativeDirectory(), `${key}.wav`);
    return file.exists && file.size > 44 ? file.uri : null;
  },
  async keys(): Promise<string[]> {
    if (Platform.OS === 'web') return (await databaseRequest<IDBValidKey[]>('readonly', store => store.getAllKeys())).map(String);
    return nativeDirectory().list().filter(file => file instanceof File && file.name.endsWith('.wav')).map(file => file.name.slice(0, -4)).filter(validKey);
  },
  async remove(key: string) {
    if (!validKey(key)) return;
    if (Platform.OS === 'web') { await databaseRequest('readwrite', store => store.delete(key)); return; }
    const file = new File(nativeDirectory(), `${key}.wav`);
    if (file.exists) file.delete();
  },
  async write(key: string, chunks: Iterable<Uint8Array>): Promise<StoredAudio> {
    if (!validKey(key)) throw new Error('Invalid audio cache key');
    if (Platform.OS === 'web') {
      const buffers: ArrayBuffer[] = [];
      let block = 0;
      for (const chunk of chunks) {
        buffers.push(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
        if (++block % 24 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
      const blob = new Blob(buffers, { type: 'audio/wav' });
      await databaseRequest('readwrite', store => store.put(blob, key));
      return blob;
    }
    const directory = nativeDirectory(), final = new File(directory, `${key}.wav`);
    const partial = new File(directory, `${key}.partial-${Date.now()}`);
    partial.create(); const handle = partial.open();
    try {
      let block = 0;
      for (const chunk of chunks) {
        handle.writeBytes(chunk);
        if (++block % 24 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
      handle.close();
      if (final.exists) final.delete();
      partial.move(final);
      return final.uri;
    } catch (error) { try { handle.close(); } catch {} if (partial.exists) partial.delete(); throw error; }
  },
};
