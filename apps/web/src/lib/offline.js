import { openDB } from 'idb';
const dbPromise = openDB('sakinah-offline', 2, { upgrade(db, oldVersion) { if (oldVersion < 1) { db.createObjectStore('content'); db.createObjectStore('outbox', { keyPath: 'clientOpId' }); } if (oldVersion < 2) db.createObjectStore('audio'); } });
export async function saveContent(key, value) { const db = await dbPromise; await db.put('content', { value, savedAt: Date.now() }, key); return value; }
export async function getContent(key) { return (await (await dbPromise).get('content', key))?.value; }
export async function removeContent(key) { await (await dbPromise).delete('content', key); }
export async function contentKeys() { return (await dbPromise).getAllKeys('content'); }
export async function saveAudio(key, blob) { const db = await dbPromise; await db.put('audio', blob, key); }
export async function getAudio(key) { return (await dbPromise).get('audio', key); }
export async function removeAudio(key) { await (await dbPromise).delete('audio', key); }
export async function audioKeys() { return (await dbPromise).getAllKeys('audio'); }
export async function queueOperation(operation) { await (await dbPromise).put('outbox', operation); }
export async function getOutbox() { return (await dbPromise).getAll('outbox'); }
export async function removeOperation(id) { await (await dbPromise).delete('outbox', id); }
export async function clearLocalData() { const db = await dbPromise; await Promise.all([db.clear('content'), db.clear('outbox'), db.clear('audio')]); }