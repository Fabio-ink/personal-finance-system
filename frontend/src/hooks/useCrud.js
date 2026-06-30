import { useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  saveLocalTransaction,
  getLocalTransactions,
  deleteLocalTransaction,
  cacheAccounts,
  getCachedAccounts,
  cacheCategories,
  getCachedCategories,
  saveCategorizationRule
} from '../services/db';

export function useCrud(endpoint) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLocalMode } = useAuth();

  const fetchItems = useCallback(async (params = {}) => {
    try {
      setLoading(true);

      if (endpoint === '/transactions') {
        const localData = await getLocalTransactions();
        setItems(localData.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
      } else if (endpoint === '/accounts') {
        const cached = await getCachedAccounts();
        if (isLocalMode) {
          const txs = await getLocalTransactions();
          const calculated = cached.map(acc => {
            let balance = acc.initialBalance || 0;
            txs.forEach(t => {
              const amt = parseFloat(t.amount) || 0;
              const inId = t.inAccount?.id || t.inAccountId;
              const outId = t.outAccount?.id || t.outAccountId;

              if (t.transactionType === 'INCOME') {
                if (String(inId) === String(acc.id)) balance += amt;
              } else if (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_CARD') {
                if (String(outId) === String(acc.id)) balance -= amt;
              } else if (t.transactionType === 'TRANSFER') {
                if (String(inId) === String(acc.id)) balance += amt;
                if (String(outId) === String(acc.id)) balance -= amt;
              }
            });
            return { ...acc, currentBalance: balance };
          });
          setItems(calculated);
        } else {
          setItems(cached);
        }
      } else if (endpoint === '/categories') {
        const cached = await getCachedCategories();
        setItems(cached);
      } else if (endpoint === '/monthly-planning') {
        const { getCachedPlanning } = await import('../services/db');
        const cached = await getCachedPlanning();
        setItems(cached);
      }

      if (isLocalMode) {
        if (endpoint === '/monthly-planning') {
          const { getCachedPlanning, getLocalTransactions } = await import('../services/db');
          const cached = await getCachedPlanning();
          const txs = await getLocalTransactions();
          const calculated = cached.map(entry => {
            let spent = 0;
            txs.forEach(t => {
              const d = new Date(t.creationDate);
              const tMonth = d.getMonth() + 1;
              const tYear = d.getFullYear();
              if (tMonth === entry.month && tYear === entry.year) {
                const catId = t.category?.id || t.categoryId;
                const isExpense = t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_CARD';
                if (isExpense && String(catId) === String(entry.category?.id)) {
                  spent += parseFloat(t.amount) || 0;
                }
              }
            });
            return { ...entry, spentAmount: spent };
          });
          setItems(calculated);
        }
        setError(null);
        setLoading(false);
        return;
      }

      const response = await api.get(endpoint, { params });
      
      if (response.data.content && Array.isArray(response.data.content)) {
        const serverItems = response.data.content;
        
        if (endpoint === '/transactions') {
          for (const item of serverItems) {
            await saveLocalTransaction({ ...item, synced: true });
          }
          const updatedLocal = await getLocalTransactions();
          setItems(updatedLocal.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
        } else {
          setItems(serverItems);
        }

        setPagination({
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
          number: response.data.number,
          size: response.data.size,
          first: response.data.first,
          last: response.data.last
        });
      } else {
        const serverItems = response.data;
        setItems(serverItems);
        setPagination(null);

        if (endpoint === '/accounts') {
          await cacheAccounts(serverItems);
        } else if (endpoint === '/categories') {
          await cacheCategories(serverItems);
        }
      }
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(`Failed to fetch ${endpoint}. Using offline data.`);
      
      if (endpoint === '/transactions') {
        const localData = await getLocalTransactions();
        setItems(localData.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
      } else if (endpoint === '/accounts') {
        const cached = await getCachedAccounts();
        setItems(cached);
      } else if (endpoint === '/categories') {
        const cached = await getCachedCategories();
        setItems(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, isLocalMode]);

  const addItem = useCallback(async (itemData) => {
    try {
      if (endpoint === '/transactions') {
        const tempId = `local_${Date.now()}`;
        const localItem = {
          ...itemData,
          id: tempId,
          synced: false
        };
        await saveLocalTransaction(localItem);
        setItems(prevItems => [localItem, ...prevItems]);

        const categoryName = itemData.category?.name || itemData.categoryName;
        if (categoryName && itemData.name) {
          const keyword = itemData.name.replace(/[0-9]+/g, '').replace(/[-*#\/\\_]+/g, ' ').trim().toLowerCase();
          if (keyword.length >= 3) {
            saveCategorizationRule(keyword, categoryName).catch(console.error);
          }
        }

        if (isLocalMode) {
          setError(null);
          return null;
        }

        api.post(endpoint, itemData).then(async (response) => {
          await deleteLocalTransaction(tempId);
          await saveLocalTransaction({ ...response.data, synced: true });
          setItems(prevItems => prevItems.map(item => item.id === tempId ? { ...response.data, synced: true } : item));
        }).catch(err => {
          console.warn('Post failed, transaction will be synced later:', err);
        });

        setError(null);
        return null;
      } else {
        if (isLocalMode) {
          const localItem = {
            ...itemData,
            id: `local_${Date.now()}`
          };
          if (endpoint === '/accounts') {
            const cached = await getCachedAccounts();
            const updated = [...cached, localItem];
            await cacheAccounts(updated);
            setItems(updated);
          } else if (endpoint === '/categories') {
            const cached = await getCachedCategories();
            const updated = [...cached, localItem];
            await cacheCategories(updated);
            setItems(updated);
          } else if (endpoint === '/monthly-planning') {
            const { getCachedPlanning, cachePlanning } = await import('../services/db');
            const cached = await getCachedPlanning();
            const updated = [...cached, localItem];
            await cachePlanning(updated);
            setItems(updated);
          }
          setError(null);
          return null;
        }

        const response = await api.post(endpoint, itemData);
        setItems(prevItems => [...prevItems, response.data]);
        setError(null);
        return null;
      }
    } catch (err) {
      console.error(`Error adding item to ${endpoint}:`, err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add item.';
      setError(errorMessage);
      return errorMessage;
    }
  }, [endpoint, isLocalMode]);

  const updateItem = useCallback(async (id, itemData) => {
    try {
      if (endpoint === '/transactions') {
        const updatedLocal = { ...itemData, id, synced: false };
        await saveLocalTransaction(updatedLocal);
        setItems(prevItems => prevItems.map(item => item.id === id ? updatedLocal : item));

        const categoryName = itemData.category?.name || itemData.categoryName;
        if (categoryName && itemData.name) {
          const keyword = itemData.name.replace(/[0-9]+/g, '').replace(/[-*#\/\\_]+/g, ' ').trim().toLowerCase();
          if (keyword.length >= 3) {
            saveCategorizationRule(keyword, categoryName).catch(console.error);
          }
        }

        if (isLocalMode) {
          setError(null);
          return null;
        }

        api.put(`${endpoint}/${id}`, itemData).then(async (response) => {
          await saveLocalTransaction({ ...response.data, synced: true });
          setItems(prevItems => prevItems.map(item => item.id === id ? { ...response.data, synced: true } : item));
        }).catch(err => {
          console.warn('Put failed, update will sync later:', err);
        });

        setError(null);
        return null;

      } else {
        if (isLocalMode) {
          const localItem = { ...itemData, id };
          if (endpoint === '/accounts') {
            const cached = await getCachedAccounts();
            const updated = cached.map(item => item.id === id ? localItem : item);
            await cacheAccounts(updated);
            setItems(updated);
          } else if (endpoint === '/categories') {
            const cached = await getCachedCategories();
            const updated = cached.map(item => item.id === id ? localItem : item);
            await cacheCategories(updated);
            setItems(updated);
          } else if (endpoint === '/monthly-planning') {
            const { getCachedPlanning, cachePlanning } = await import('../services/db');
            const cached = await getCachedPlanning();
            const updated = cached.map(item => item.id === id ? localItem : item);
            await cachePlanning(updated);
            setItems(updated);
          }
          setError(null);
          return null;
        }

        const response = await api.put(`${endpoint}/${id}`, itemData);
        setItems(prevItems => prevItems.map(item => item.id === id ? response.data : item));
        setError(null);
        return null;
      }
    } catch (err) {
      console.error(`Error updating item in ${endpoint}:`, err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update item.';
      setError(errorMessage);
      return errorMessage;
    }
  }, [endpoint, isLocalMode]);

  const deleteItem = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (endpoint === '/transactions') {
          await deleteLocalTransaction(id);
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          
          if (isLocalMode) {
            setError(null);
            return null;
          }

          if (!String(id).startsWith('local_')) {
            api.delete(`${endpoint}/${id}`).catch(err => {
              console.warn('Delete on server failed:', err);
            });
          }
          setError(null);
          return null;
        } else {
          if (isLocalMode) {
            if (endpoint === '/accounts') {
              const cached = await getCachedAccounts();
              const updated = cached.filter(item => item.id !== id);
              await cacheAccounts(updated);
              setItems(updated);
            } else if (endpoint === '/categories') {
              const cached = await getCachedCategories();
              const updated = cached.filter(item => item.id !== id);
              await cacheCategories(updated);
              setItems(updated);
            } else if (endpoint === '/monthly-planning') {
              const { getCachedPlanning, cachePlanning } = await import('../services/db');
              const cached = await getCachedPlanning();
              const updated = cached.filter(item => item.id !== id);
              await cachePlanning(updated);
              setItems(updated);
            }
            setError(null);
            return null;
          }

          await api.delete(`${endpoint}/${id}`);
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          setError(null);
          return null;
        }
      } catch (err) {
        console.error(`Error deleting item from ${endpoint}:`, err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete item.';
        setError(errorMessage);
        return errorMessage;
      }
    }
    return null;
  }, [endpoint, isLocalMode]);

  const deleteMultipleItems = useCallback(async (ids) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} items?`)) {
      try {
        if (endpoint === '/transactions') {
          const serverIds = [];
          for (const id of ids) {
            await deleteLocalTransaction(id);
            if (!String(id).startsWith('local_')) {
              serverIds.push(id);
            }
          }
          setItems(prevItems => prevItems.filter(item => !ids.includes(item.id)));

          if (isLocalMode) {
            return null;
          }

          if (serverIds.length > 0) {
            api.post(`${endpoint}/delete-multiple`, serverIds).catch(err => {
              console.warn('Bulk delete on server failed:', err);
            });
          }
          return null;
        } else {
          if (isLocalMode) {
            if (endpoint === '/accounts') {
              const cached = await getCachedAccounts();
              const updated = cached.filter(item => !ids.includes(item.id));
              await cacheAccounts(updated);
              setItems(updated);
            } else if (endpoint === '/categories') {
              const cached = await getCachedCategories();
              const updated = cached.filter(item => !ids.includes(item.id));
              await cacheCategories(updated);
              setItems(updated);
            } else if (endpoint === '/monthly-planning') {
              const { getCachedPlanning, cachePlanning } = await import('../services/db');
              const cached = await getCachedPlanning();
              const updated = cached.filter(item => !ids.includes(item.id));
              await cachePlanning(updated);
              setItems(updated);
            }
            return null;
          }

          await api.post(`${endpoint}/delete-multiple`, ids);
          setItems(prevItems => prevItems.filter(item => !ids.includes(item.id)));
          return null;
        }
      } catch (err) {
        console.error(`Error deleting items from ${endpoint}:`, err);
        return err;
      }
    }
    return null;
  }, [endpoint, isLocalMode]);

  return { items, loading, error, addItem, updateItem, deleteItem, deleteMultipleItems, fetchItems, pagination };
}
