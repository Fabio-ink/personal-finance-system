import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCrud } from '../hooks/useCrud';
import { useSelection } from '../hooks/useSelection';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/ui/PageTitle';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/dateUtils';
import { 
  PieChart, 
  Plus, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  Wallet, 
  CreditCard 
} from 'lucide-react';

function CategoriesAccountsPage() {
  const { t } = useTranslation();
  const { isLocalMode } = useAuth();

  const {
    items: categories,
    loading: categoriesLoading,
    error: categoriesError,
    addItem: addCategoryItem,
    updateItem: updateCategoryItem,
    deleteMultipleItems: deleteMultipleCategories,
    fetchItems: fetchCategories
  } = useCrud('/categories');

  const {
    items: accounts,
    loading: accountsLoading,
    error: accountsError,
    addItem: addAccountItem,
    updateItem: updateAccountItem,
    deleteItem: deleteAccountItem,
    fetchItems: fetchAccounts
  } = useCrud('/accounts');

  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const {
    selectedItems: selectedCategories,
    handleSelect: handleSelectCategory,
    handleSelectAll: handleSelectAllCategories,
    clearSelection: clearCategorySelection,
    isAllSelected: isAllCategoriesSelected
  } = useSelection(categories);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
  }, [fetchCategories, fetchAccounts]);

  const handleOpenNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const categoryData = { name: categoryName };

    if (editingCategory) {
      await updateCategoryItem(editingCategory.id, categoryData);
    } else {
      await addCategoryItem(categoryData);
    }

    setCategoryName('');
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
    fetchCategories();
  };

  const handleDeleteSelectedCategories = async () => {
    await deleteMultipleCategories(Array.from(selectedCategories));
    clearCategorySelection();
    fetchCategories();
  };

  const handleOpenNewAccountModal = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountBalance('');
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountBalance(account.initialBalance.toString());
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    const accountData = {
      name: accountName,
      initialBalance: parseFloat(accountBalance),
      isMain: editingAccount ? editingAccount.isMain : false
    };

    if (editingAccount) {
      await updateAccountItem(editingAccount.id, accountData);
    } else {
      await addAccountItem(accountData);
    }

    setAccountName('');
    setAccountBalance('');
    setEditingAccount(null);
    setIsAccountModalOpen(false);
    fetchAccounts();
  };

  const handleDeleteAccount = async (id) => {
    await deleteAccountItem(id);
    fetchAccounts();
  };

  const handleToggleMainAccount = async (account) => {
    const nextStatus = !account.isMain;
    const accountData = {
      name: account.name,
      initialBalance: account.initialBalance,
      isMain: nextStatus
    };

    if (isLocalMode) {
      const { getCachedAccounts, cacheAccounts } = await import('../services/db');
      const cached = await getCachedAccounts();
      const updated = cached.map(acc => {
        if (acc.id === account.id) {
          return { ...acc, isMain: nextStatus };
        }
        return nextStatus ? { ...acc, isMain: false } : acc;
      });
      await cacheAccounts(updated);
      fetchAccounts();
    } else {
      await updateAccountItem(account.id, accountData);
      fetchAccounts();
    }
  };

  const getAccountLogoConfig = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('nubank')) return { bg: 'bg-[#820ad1]', text: 'Nu', color: 'text-white' };
    if (lower.includes('inter')) return { bg: 'bg-[#ff7a00]', text: 'Int', color: 'text-white' };
    if (lower.includes('itaú') || lower.includes('itau')) return { bg: 'bg-[#ec7000]', text: 'Ita', color: 'text-white font-bold' };
    if (lower.includes('banco do brasil') || lower.includes('bb ') || lower.endsWith('bb')) return { bg: 'bg-[#ffd700]', text: 'BB', color: 'text-[#003399] font-bold' };
    if (lower.includes('bradesco')) return { bg: 'bg-[#cc092f]', text: 'Brd', color: 'text-white' };
    if (lower.includes('caixa')) return { bg: 'bg-[#005ca9]', text: 'CX', color: 'text-white font-bold' };
    if (lower.includes('santander')) return { bg: 'bg-[#ec0000]', text: 'San', color: 'text-white' };
    if (lower.includes('c6')) return { bg: 'bg-black border border-brand-border', text: 'C6', color: 'text-white font-extrabold' };
    if (lower.includes('xp ')) return { bg: 'bg-[#1a1a1a]', text: 'XP', color: 'text-[#ffd700] font-black' };
    if (lower.includes('btg')) return { bg: 'bg-[#0a192f]', text: 'BTG', color: 'text-[#ffd700] font-bold' };
    if (lower.includes('mercado pago') || lower.includes('mercadopago')) return { bg: 'bg-[#009ee3]', text: 'MP', color: 'text-white font-bold' };
    if (lower.includes('picpay')) return { bg: 'bg-[#21c25e]', text: 'Pic', color: 'text-white' };
    if (lower.includes('pagbank') || lower.includes('pagseguro')) return { bg: 'bg-[#00b050]', text: 'Pag', color: 'text-white font-semibold' };
    if (lower.includes('neon')) return { bg: 'bg-[#00e5ff]', text: 'Neo', color: 'text-[#0a192f] font-bold' };
    if (lower.includes('sicoob')) return { bg: 'bg-[#003641]', text: 'Sic', color: 'text-[#ffd700]' };
    if (lower.includes('bipa')) return { bg: 'bg-black border border-brand-border', text: 'Bi', color: 'text-[#e91e63] font-bold' };
    if (lower.includes('mercado bitcoin') || lower.includes('mercadobitcoin')) return { bg: 'bg-[#ff6b00]', text: 'MB', color: 'text-white font-bold' };
    if (lower.includes('rico')) return { bg: 'bg-[#ff5a00]', text: 'Ri', color: 'text-white font-extrabold' };
    if (lower.includes('carteira') || lower.includes('dinheiro')) return { bg: 'bg-brand-card-hover', icon: 'wallet', color: 'text-brand-primary' };
    return { bg: 'bg-brand-primary/10', icon: 'credit-card', color: 'text-brand-primary' };
  };

  const getAccountTitle = (name) => {
    if (name.includes('(')) {
      return name.split('(')[0].trim();
    }
    return name;
  };

  const getAccountSubtitle = (name) => {
    if (name.includes('(')) return name;
    if (name.toLowerCase().includes('carteira') || name.toLowerCase().includes('dinheiro')) return `${name} (Dinheiro)`;
    if (name.toLowerCase().includes('poupança')) return `${name} (Poupança)`;
    if (name.toLowerCase().includes('c6') || name.toLowerCase().includes('crédito') || name.toLowerCase().includes('credito')) return `${name} (Crédito)`;
    return `${name} (Corrente)`;
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle>{t('common.categoriesAccounts')}</PageTitle>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="text-brand-primary" size={24} />
              {t('categories.title')}
            </h3>
            <Button
              onClick={handleOpenNewCategoryModal}
              className="bg-brand-primary/20 hover:bg-brand-primary/30 text-white border border-brand-primary/40 shadow-[0_0_15px_rgba(138,109,255,0.2)] px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Plus size={18} />
              {t('categories.addCategory')}
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : categoriesError ? (
            <ErrorMessage message={categoriesError} />
          ) : (
            <div className="flex-1 flex flex-col">
              {categories.length > 0 && (
                <div className="flex items-center justify-between p-3.5 mb-2 border-b border-brand-border/10">
                  <Checkbox
                    id="selectAllCategories"
                    checked={isAllCategoriesSelected}
                    onChange={handleSelectAllCategories}
                    label={t('planning.selectAll')}
                  />
                  {selectedCategories.size > 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteSelectedCategories}
                      className="py-1 px-3"
                    >
                      {t('common.delete')} ({selectedCategories.size})
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-dark/20 hover:bg-brand-card-hover/30 border border-transparent hover:border-brand-border/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`category-${cat.id}`}
                          checked={selectedCategories.has(cat.id)}
                          onChange={() => handleSelectCategory(cat.id)}
                          label={t(`categories.${cat.name.toLowerCase()}`, cat.name)}
                        />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 text-text-secondary hover:text-brand-warning hover:bg-brand-warning/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">{t('categories.noCategories')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg flex flex-col h-full">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="text-brand-primary" size={24} />
              {t('accounts.title')}
            </h3>
            <Button
              onClick={handleOpenNewAccountModal}
              className="bg-brand-primary/20 hover:bg-brand-primary/30 text-white border border-brand-primary/40 shadow-[0_0_15px_rgba(138,109,255,0.2)] px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <CreditCard size={18} />
              {t('accounts.addAccount')}
            </Button>
          </div>
          <p className="text-xs text-text-secondary mb-6 leading-relaxed">
            {t('accounts.selectMainNote')}
          </p>

          {accountsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : accountsError ? (
            <ErrorMessage message={accountsError} />
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {accounts.length > 0 ? (
                accounts.map(account => {
                  const logoConfig = getAccountLogoConfig(account.name);
                  return (
                    <div 
                      key={account.id} 
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-dark/20 hover:bg-brand-card-hover/30 border border-transparent hover:border-brand-border/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`main-acc-${account.id}`}
                          checked={account.isMain || false}
                          onChange={() => handleToggleMainAccount(account)}
                        />
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm select-none ${logoConfig.bg} ${logoConfig.color}`}>
                          {logoConfig.icon === 'wallet' ? (
                            <Wallet size={20} />
                          ) : logoConfig.icon === 'credit-card' ? (
                            <CreditCard size={20} />
                          ) : (
                            logoConfig.text
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {getAccountTitle(account.name)}
                            </span>
                            {account.isMain && (
                              <div className="flex items-center text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider gap-0.5">
                                <ShieldCheck size={10} className="fill-amber-400/20" />
                                P
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">
                            {getAccountSubtitle(account.name)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white font-mono text-sm">
                          {formatCurrency(account.currentBalance)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditAccount(account)}
                            className="p-2 text-text-secondary hover:text-brand-warning hover:bg-brand-warning/10 rounded-xl transition-all cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-2 text-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-secondary">{t('accounts.noAccounts')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isCategoryModalOpen} onCancel={() => setIsCategoryModalOpen(false)}>
        <form onSubmit={handleCategorySubmit} className="space-y-5">
          <h4 className="text-lg font-bold text-white mb-2">
            {editingCategory ? t('categories.title') : t('categories.addCategory')}
          </h4>
          <Input
            id="modal-category-name"
            label={t('categories.name')}
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder={t('categories.placeholderName')}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAccountModalOpen} onCancel={() => setIsAccountModalOpen(false)}>
        <form onSubmit={handleAccountSubmit} className="space-y-5">
          <h4 className="text-lg font-bold text-white mb-2">
            {editingAccount ? t('accounts.updateAccount') : t('accounts.addAccount')}
          </h4>
          <Input
            id="modal-account-name"
            label={t('accounts.name')}
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={t('accounts.placeholderName')}
            required
          />
          <Input
            id="modal-account-balance"
            label={t('accounts.initialBalance')}
            type="number"
            step="0.01"
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
            placeholder="0.00"
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsAccountModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CategoriesAccountsPage;
