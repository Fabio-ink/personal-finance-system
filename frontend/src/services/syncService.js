import api from './api';
import { getUnsyncedTransactions, markAsSynced, cacheCategories, getCachedCategories } from './db';

let isSyncing = false;
let syncIntervalId = null;

export async function syncOfflineTransactions() {
  if (isSyncing) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  const unsynced = await getUnsyncedTransactions();
  if (unsynced.length === 0) return null;

  isSyncing = true;
  try {
    const payload = unsynced.map(t => ({
      name: t.name,
      amount: t.amount,
      creationDate: t.creationDate,
      transactionType: t.transactionType,
      categoryName: t.category?.name || t.categoryName,
      inAccountName: t.inAccount?.name || t.inAccountName,
      outAccountName: t.outAccount?.name || t.outAccountName,
      installmentNumber: t.installmentNumber,
      totalInstallments: t.totalInstallments
    }));

    const response = await api.post('/transactions/sync', payload);
    const syncedItems = response.data;

    for (let i = 0; i < unsynced.length; i++) {
      const localItem = unsynced[i];
      const matchedServerItem = syncedItems[i] || syncedItems.find(s => 
        s.name === localItem.name && 
        Math.abs(parseFloat(s.amount) - localItem.amount) < 0.01 && 
        s.creationDate === localItem.creationDate
      );

      if (matchedServerItem) {
        await markAsSynced(localItem.id, matchedServerItem);
      }
    }

    if (syncedItems.length > 0) {
      const cachedCats = await getCachedCategories().catch(() => []);
      const newCats = [];
      
      syncedItems.forEach(t => {
        if (t.category && t.category.id) {
          const exists = cachedCats.some(c => String(c.id) === String(t.category.id));
          const alreadyAdded = newCats.some(c => String(c.id) === String(t.category.id));
          if (!exists && !alreadyAdded) {
            newCats.push(t.category);
          }
        }
      });
      
      if (newCats.length > 0) {
        await cacheCategories([...cachedCats, ...newCats]).catch(console.error);
      }
    }

    return syncedItems;
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
}

export function startSyncLoop(onSyncSuccess) {
  if (syncIntervalId) clearInterval(syncIntervalId);

  const runSync = async () => {
    try {
      const synced = await syncOfflineTransactions();
      if (synced && onSyncSuccess) {
        onSyncSuccess();
      }
    } catch {
      // Ignored for background sync resiliency
    }
  };

  runSync();
  syncIntervalId = setInterval(runSync, 15000);
}

export function stopSyncLoop() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
