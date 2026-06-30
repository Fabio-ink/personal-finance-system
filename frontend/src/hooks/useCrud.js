import { useState, useCallback } from 'react';
import api from '../services/api';
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

  const fetchItems = useCallback(async (params = {}) => {
    try {
      setLoading(true);

      if (endpoint === '/transactions') {
        const localData = await getLocalTransactions();
        if (localData && localData.length > 0) {
          setItems(localData.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
        }
      } else if (endpoint === '/accounts') {
        const cached = await getCachedAccounts();
        if (cached && cached.length > 0) {
          setItems(cached);
        }
      } else if (endpoint === '/categories') {
        const cached = await getCachedCategories();
        if (cached && cached.length > 0) {
          setItems(cached);
        }
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
  }, [endpoint]);

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
  }, [endpoint]);

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

        api.put(`${endpoint}/${id}`, itemData).then(async (response) => {
          await saveLocalTransaction({ ...response.data, synced: true });
          setItems(prevItems => prevItems.map(item => item.id === id ? { ...response.data, synced: true } : item));
        }).catch(err => {
          console.warn('Put failed, update will sync later:', err);
        });

        setError(null);
        return null;
      } else {
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
  }, [endpoint]);

  const deleteItem = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (endpoint === '/transactions') {
          await deleteLocalTransaction(id);
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          
          if (!String(id).startsWith('local_')) {
            api.delete(`${endpoint}/${id}`).catch(err => {
              console.warn('Delete on server failed:', err);
            });
          }
          setError(null);
          return null;
        } else {
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
  }, [endpoint]);

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

          if (serverIds.length > 0) {
            api.post(`${endpoint}/delete-multiple`, serverIds).catch(err => {
              console.warn('Bulk delete on server failed:', err);
            });
          }
          return null;
        } else {
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
  }, [endpoint]);

  return { items, loading, error, addItem, updateItem, deleteItem, deleteMultipleItems, fetchItems, pagination };
}
