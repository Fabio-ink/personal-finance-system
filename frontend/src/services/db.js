const DB_NAME = 'syncwallet_db';
const DB_VERSION = 3;

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('rules')) {
        db.createObjectStore('rules', { keyPath: 'keyword' });
      }
      if (!db.objectStoreNames.contains('planning')) {
        db.createObjectStore('planning', { keyPath: 'id' });
      }
    };
  });
}

export async function saveLocalTransaction(transaction) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['transactions'], 'readwrite');
    const store = transactionObj.objectStore('transactions');
    const request = store.put(transaction);

    request.onsuccess = () => resolve(transaction);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getLocalTransactions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['transactions'], 'readonly');
    const store = transactionObj.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function deleteLocalTransaction(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['transactions'], 'readwrite');
    const store = transactionObj.objectStore('transactions');
    const request = store.delete(id);
    request.onsuccess = () => {
      const numericId = Number(id);
      if (!isNaN(numericId) && typeof id !== 'number') {
        const req2 = store.delete(numericId);
        req2.onsuccess = () => resolve();
        req2.onerror = (event) => reject(event.target.error);
      } else {
        const stringId = String(id);
        if (stringId !== String(numericId)) {
          const req2 = store.delete(stringId);
          req2.onsuccess = () => resolve();
          req2.onerror = (event) => reject(event.target.error);
        } else {
          resolve();
        }
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getUnsyncedTransactions() {
  const transactions = await getLocalTransactions();
  return transactions.filter(t => !t.synced);
}

export async function markAsSynced(localId, serverTransaction) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['transactions'], 'readwrite');
    const store = transactionObj.objectStore('transactions');
    
    const deleteRequest = store.delete(localId);
    
    deleteRequest.onsuccess = () => {
      const addRequest = store.put({
        ...serverTransaction,
        synced: true
      });
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = (event) => reject(event.target.error);
    };
    
    deleteRequest.onerror = (event) => reject(event.target.error);
  });
}

export async function cacheAccounts(accounts) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['accounts'], 'readwrite');
    const store = transactionObj.objectStore('accounts');
    store.clear();
    accounts.forEach(acc => store.put(acc));
    transactionObj.oncomplete = () => resolve();
    transactionObj.onerror = (event) => reject(event.target.error);
  });
}

export async function getCachedAccounts() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['accounts'], 'readonly');
    const store = transactionObj.objectStore('accounts');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function cacheCategories(categories) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['categories'], 'readwrite');
    const store = transactionObj.objectStore('categories');
    store.clear();
    categories.forEach(cat => store.put(cat));
    transactionObj.oncomplete = () => resolve();
    transactionObj.onerror = (event) => reject(event.target.error);
  });
}

export async function getCachedCategories() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['categories'], 'readonly');
    const store = transactionObj.objectStore('categories');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function saveCategorizationRule(keyword, categoryName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['rules'], 'readwrite');
    const store = transactionObj.objectStore('rules');
    const request = store.put({ keyword: keyword.toLowerCase().trim(), categoryName });
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getCategorizationRules() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['rules'], 'readonly');
    const store = transactionObj.objectStore('rules');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function cachePlanning(planningEntries) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['planning'], 'readwrite');
    const store = transactionObj.objectStore('planning');
    store.clear();
    planningEntries.forEach(entry => store.put(entry));
    transactionObj.oncomplete = () => resolve();
    transactionObj.onerror = (event) => reject(event.target.error);
  });
}

export async function getCachedPlanning() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['planning'], 'readonly');
    const store = transactionObj.objectStore('planning');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function clearAllLocalData() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transactionObj = db.transaction(['transactions', 'accounts', 'categories', 'rules', 'planning'], 'readwrite');
    transactionObj.objectStore('transactions').clear();
    transactionObj.objectStore('accounts').clear();
    transactionObj.objectStore('categories').clear();
    transactionObj.objectStore('rules').clear();
    transactionObj.objectStore('planning').clear();
    
    transactionObj.oncomplete = () => resolve();
    transactionObj.onerror = (event) => reject(event.target.error);
  });
}
