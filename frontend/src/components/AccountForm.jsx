import React, { useState, useEffect } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import { createAccount, updateAccount } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

function AccountForm({ account, onSave, onCancel, onDelete }) {
  const { isLocalMode } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setInitialBalance(account.initialBalance);
    } else {
      setName('');
      setInitialBalance('');
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const accountData = {
        name,
        initialBalance: parseFloat(initialBalance),
        currentBalance: parseFloat(initialBalance)
      };

      if (isLocalMode) {
        const { getCachedAccounts, cacheAccounts } = await import('../services/db');
        const cached = await getCachedAccounts();
        if (account && account.id) {
          const updated = cached.map(acc => acc.id === account.id ? { ...acc, ...accountData } : acc);
          await cacheAccounts(updated);
        } else {
          const newAcc = {
            ...accountData,
            id: `local_${Date.now()}`
          };
          const updated = [...cached, newAcc];
          await cacheAccounts(updated);
        }
        onSave();
        return;
      }

      if (account && account.id) {
        await updateAccount(account.id, accountData);
      } else {
        await createAccount(accountData);
      }
      onSave();
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('accounts.deleteConfirm'))) {
        setLoading(true);
        try {
            await onDelete(account.id);
        } catch (error) {
            console.error("Error deleting account:", error);
        } finally {
            setLoading(false);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label={t('accounts.name')} 
        type="text" 
        placeholder={t('accounts.placeholderName')} 
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input 
        label={t('accounts.initialBalance')} 
        type="number" 
        step="0.01" 
        placeholder="0.00" 
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
        required
      />
      <div className="flex justify-between items-center mt-6">
        {account && (
            <Button 
                variant="danger" 
                type="button" 
                onClick={handleDelete} 
                disabled={loading}
            >
                {t('common.delete')}
            </Button>
        )}
        <div className={`flex gap-2 ${!account ? 'w-full justify-end' : ''}`}>
            <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" disabled={loading}>
            {loading ? t('common.saving') : (account ? t('accounts.updateAccount') : t('accounts.saveAccount'))}
            </Button>
        </div>
      </div>
    </form>
  );
}

export default AccountForm;
