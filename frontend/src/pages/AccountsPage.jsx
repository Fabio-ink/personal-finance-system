import React, { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useSelection } from '../hooks/useSelection';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/dateUtils';

function AccountsPage() {
  const { t } = useTranslation();
  const { items: accounts, loading, error, addItem, updateItem, deleteMultipleItems, fetchItems } = useCrud('/accounts');
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  
  const { selectedItems: selectedAccounts, handleSelect, handleSelectAll, clearSelection, isAllSelected } = useSelection(accounts);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accountData = { name, initialBalance: parseFloat(initialBalance) };

    if (editingAccount) {
      await updateItem(editingAccount.id, accountData);
    } else {
      await addItem(accountData);
    }
    
    setName('');
    setInitialBalance('');
    setEditingAccount(null);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setName(account.name);
    setInitialBalance(account.initialBalance);
  };

  const handleDeleteSelected = async () => {
    await deleteMultipleItems(Array.from(selectedAccounts));
    clearSelection();
  };
  
  const cancelEdit = () => {
    setEditingAccount(null);
    setName('');
    setInitialBalance('');
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <PageTitle>{t('accounts.title')}</PageTitle>
        {selectedAccounts.size > 0 && (
            <Button 
                variant="danger"
                onClick={handleDeleteSelected}>
                {t('accounts.deleteSelected')} ({selectedAccounts.size})
            </Button>
        )}
      </div>

      <Card as="form" onSubmit={handleSubmit} className="mb-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input id="acc-name" label={t('accounts.name')} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('accounts.placeholderAccount')} required />
          </div>
          <div>
            <Input id="acc-balance" label={t('accounts.initialBalance')} type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0.00" required />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" variant="primary" className="w-full">
              {editingAccount ? t('common.update') : t('common.save')}
            </Button>
            {editingAccount && (
              <Button onClick={cancelEdit} type="button" variant="ghost" className="w-full">
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="space-y-3">
            {accounts.length > 0 ? (
                <>
                    <div className="flex items-center p-3">
                        <Checkbox id="selectAllAccounts" checked={isAllSelected} onChange={handleSelectAll} label={t('planning.selectAll')}/>
                    </div>
                    {accounts.map(account => (
                        <Card key={account.id} className={`flex justify-between items-center p-3 ${selectedAccounts.has(account.id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                            <div className="flex items-center">
                                <Checkbox id={`account-${account.id}`} checked={selectedAccounts.has(account.id)} onChange={() => handleSelect(account.id)} />
                                <span className="font-semibold dark:text-gray-200 ml-2">{account.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {formatCurrency(account.currentBalance)}
                                </span>
                                <div className="flex space-x-2">
                                    <Button onClick={() => handleEdit(account)} variant="warning" size="sm">{t('common.edit')}</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </>
          ) : (
            <Card className="text-center p-6">
              <p className="text-gray-500 dark:text-gray-400">{t('accounts.noAccounts')}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default AccountsPage;