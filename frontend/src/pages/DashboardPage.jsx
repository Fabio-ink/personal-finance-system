import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction, updateTransaction, deleteAccount } from '../services/api'; 
import { useAuth } from '../contexts/AuthContext'; 
import MonthSummaryCard from '../components/MonthSummaryCard';
import TransactionChart from '../components/TransactionChart';
import Card from '../components/ui/Card';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PageTitle from '../components/ui/PageTitle';
import Input from '../components/ui/Input';
import DashboardAction from '../components/DashboardAction';
import { formatCurrency } from '../utils/dateUtils';
import { PlusCircle } from 'lucide-react'; 
import { useTranslation } from 'react-i18next';
import { ptBR, enUS } from 'date-fns/locale';
import api from '../services/api';
import AccountForm from '../components/AccountForm';
import AccountsListModal from '../components/AccountsListModal';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getLocalTransactions, getCachedAccounts, getCachedCategories } from '../services/db';

const calculateLocalSummary = (transactions) => {
  const getMonthData = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    let totalIncome = 0;
    let totalSpent = 0;
    
    transactions.forEach(t => {
      const tDate = new Date(t.creationDate);
      if (tDate >= start && tDate <= end) {
        const amt = parseFloat(t.amount) || 0;
        if (t.transactionType === 'INCOME') {
          totalIncome += amt;
        } else if (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_CARD') {
          totalSpent += amt;
        }
      }
    });

    return { totalSpent, totalIncome, plannedBudget: 0 };
  };

  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  const previousMonth2 = subMonths(currentMonth, 2);
  const nextMonth = addMonths(currentMonth, 1);

  return {
    previous2: getMonthData(previousMonth2),
    previous: getMonthData(previousMonth),
    current: getMonthData(currentMonth),
    next: getMonthData(nextMonth)
  };
};

const mergeSummaryWithLocalUnsynced = (serverSummary, localTransactions) => {
  if (!serverSummary) return null;
  const unsynced = localTransactions.filter(t => !t.synced);
  if (unsynced.length === 0) return serverSummary;

  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  const previousMonth2 = subMonths(currentMonth, 2);
  const nextMonth = addMonths(currentMonth, 1);

  const applyUnsyncedToMonth = (monthData, date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    let extraIncome = 0;
    let extraSpent = 0;

    unsynced.forEach(t => {
      const tDate = new Date(t.creationDate);
      if (tDate >= start && tDate <= end) {
        const amt = parseFloat(t.amount) || 0;
        if (t.transactionType === 'INCOME') {
          extraIncome += amt;
        } else if (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_CARD') {
          extraSpent += amt;
        }
      }
    });

    return {
      ...monthData,
      totalIncome: (monthData?.totalIncome || 0) + extraIncome,
      totalSpent: (monthData?.totalSpent || 0) + extraSpent
    };
  };

  return {
    previous2: applyUnsyncedToMonth(serverSummary.previous2, previousMonth2),
    previous: applyUnsyncedToMonth(serverSummary.previous, previousMonth),
    current: applyUnsyncedToMonth(serverSummary.current, currentMonth),
    next: applyUnsyncedToMonth(serverSummary.next, nextMonth)
  };
};

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { isLocalMode } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  
  // Account Modals State
  const [isAccountFormModalOpen, setAccountFormModalOpen] = useState(false);
  const [isAccountsListModalOpen, setAccountsListModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);

  // Calculate dynamic months
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  const previousMonth2 = subMonths(currentMonth, 2);
  const nextMonth = addMonths(currentMonth, 1);

  const dateLocale = i18n.language.startsWith('pt') ? ptBR : enUS;

  const previousMonthName = format(previousMonth, 'MMMM', { locale: dateLocale });
  const previousMonth2Name = format(previousMonth2, 'MMMM', { locale: dateLocale });
  const currentMonthName = format(currentMonth, 'MMMM', { locale: dateLocale });
  const nextMonthName = format(nextMonth, 'MMMM', { locale: dateLocale });

  // Capitalize first letter
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const fetchAllData = useCallback(async () => {
    try {
      const localTrans = await getLocalTransactions().catch(() => []);
      const cachedAccounts = await getCachedAccounts().catch(() => []);
      const cachedCategories = await getCachedCategories().catch(() => []);

      if (localTrans && localTrans.length > 0) {
        setAllTransactions(localTrans.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
      }
      if (cachedAccounts && cachedAccounts.length > 0) {
        setAccounts(cachedAccounts);
      }
      if (cachedCategories && cachedCategories.length > 0) {
        setCategories(cachedCategories);
      }

      const localSummary = calculateLocalSummary(localTrans);
      setMonthlySummary(localSummary);

      if (isLocalMode) {
        const calculatedAccounts = cachedAccounts.map(acc => {
          let balance = acc.initialBalance || 0;
          localTrans.forEach(t => {
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
        setAccounts(calculatedAccounts);

        setError(null);
        setLoading(false);
        return;
      }

      const [summaryRes, transRes, accountsRes, categoriesRes] = await Promise.all([
        api.get('/dashboard/summary'), 
        api.get('/transactions?size=2000'),     
        api.get('/accounts'),         
        api.get('/categories')        
      ]);

      const serverTransactions = transRes.data.content || [];
      const { saveLocalTransaction } = await import('../services/db');
      for (const item of serverTransactions) {
        await saveLocalTransaction({ ...item, synced: true });
      }

      const consolidatedTrans = await getLocalTransactions();
      setAllTransactions(consolidatedTrans.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)));
      
      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);

      const finalSummary = mergeSummaryWithLocalUnsynced(summaryRes.data, consolidatedTrans);
      setMonthlySummary(finalSummary);

      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isLocalMode]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenModal = useCallback((type = 'EXPENSE') => {
    setTransactionToEdit({ transactionType: type });
    setTransactionModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setTransactionToEdit(null);
    setTransactionModalOpen(false);
  }, []);

  // Account Handlers
  const handleOpenAccountForm = useCallback((account = null) => {
    setAccountToEdit(account);
    setAccountFormModalOpen(true);
    setAccountsListModalOpen(false);
  }, []);

  const handleCloseAccountForm = useCallback(() => {
    setAccountToEdit(null);
    setAccountFormModalOpen(false);
  }, []);

  const handleOpenAccountsList = useCallback(() => {
    setAccountsListModalOpen(true);
  }, []);

  const handleCloseAccountsList = useCallback(() => {
    setAccountsListModalOpen(false);
  }, []);

  const handleSaveTransaction = useCallback(async (transactionData) => {
    try {
      if (isLocalMode) {
        const { saveLocalTransaction } = await import('../services/db');
        if (transactionToEdit && transactionToEdit.id) {
          await saveLocalTransaction({ ...transactionData, id: transactionToEdit.id, synced: false });
        } else {
          await saveLocalTransaction({ ...transactionData, id: `local_${Date.now()}`, synced: false });
        }
        handleCloseModal();
        fetchAllData();
        return;
      }

      if (transactionToEdit && transactionToEdit.id) {
        await updateTransaction(transactionToEdit.id, transactionData);
      } else {
        await createTransaction(transactionData);
      }
      handleCloseModal();
      fetchAllData(); 
    } catch (error) {
      console.error("Error saving transaction", error);
    }
  }, [transactionToEdit, handleCloseModal, fetchAllData, isLocalMode]);

  const handleSaveAccount = useCallback(() => {
    handleCloseAccountForm();
    fetchAllData();
  }, [handleCloseAccountForm, fetchAllData]);

  const handleDeleteAccount = useCallback(async (accountId) => {
    try {
        if (isLocalMode) {
          const { getCachedAccounts, cacheAccounts } = await import('../services/db');
          const cached = await getCachedAccounts();
          const updated = cached.filter(acc => acc.id !== accountId);
          await cacheAccounts(updated);
          handleCloseAccountForm();
          fetchAllData();
          return;
        }

        await deleteAccount(accountId);
        handleCloseAccountForm();
        fetchAllData();
    } catch (error) {
        console.error("Error deleting account", error);
        alert(t('dashboard.deleteAccountConfirm'));
    }
  }, [handleCloseAccountForm, fetchAllData, isLocalMode]);

  const handleMonthTitleClick = (date) => {
    const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
    navigate('/transactions', { 
        state: { 
            activeTab: 'transactions', 
            startDate, 
            endDate 
        } 
    });
  };

  const handleMonthPlanningClick = (date) => {
    navigate('/transactions', { 
        state: { 
            activeTab: 'planning', 
            planningMonth: date.getMonth() + 1, 
            planningYear: date.getFullYear() 
        } 
    });
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const currencyLocale = i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';
  const currencyCode = i18n.language.startsWith('pt') ? 'BRL' : 'USD';

  return (
    <>
      <div className="container mx-auto space-y-8 p-4">
        
        {/* Row 1: Monthly Summaries */}
        {monthlySummary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MonthSummaryCard 
                title={capitalize(previousMonth2Name)} 
                {...monthlySummary.previous2} 
                onClickTitle={() => handleMonthTitleClick(previousMonth2)}
                onClickPercentage={() => handleMonthPlanningClick(previousMonth2)}
            />
            <MonthSummaryCard 
                title={capitalize(previousMonthName)} 
                {...monthlySummary.previous} 
                onClickTitle={() => handleMonthTitleClick(previousMonth)}
                onClickPercentage={() => handleMonthPlanningClick(previousMonth)}
            />
            <MonthSummaryCard 
                title={capitalize(currentMonthName)} 
                {...monthlySummary.current} 
                className="border-brand-primary border-2 shadow-brand-primary/20 shadow-xl"
                onClickTitle={() => handleMonthTitleClick(currentMonth)}
                onClickPercentage={() => handleMonthPlanningClick(currentMonth)}
            />
            <MonthSummaryCard 
                title={capitalize(nextMonthName)} 
                {...monthlySummary.next} 
                onClickTitle={() => handleMonthTitleClick(nextMonth)}
                onClickPercentage={() => handleMonthPlanningClick(nextMonth)}
            />
          </div>
        ) : (
          <p className="text-gray-400">{t('dashboard.loadingSummary')}</p>
        )}
        
        {/* Row 2: Chart & Actions/Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
          {/* Chart (2/3) */}
          <div className="lg:col-span-2 min-h-[400px]">
            <Card className="p-6 h-full flex flex-col bg-brand-card rounded-2xl border border-brand-border/30 shadow-lg">
              <PageTitle level={2} className="text-xl font-bold mb-6 text-white">{t('dashboard.charts')}</PageTitle>
              <div className="flex-1 min-h-0">
                {allTransactions.length > 0 ? (
                  <TransactionChart transactions={allTransactions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-text-secondary">
                    {t('dashboard.noChartData')}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column (1/3): Actions & Accounts */}
          <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Actions */}
              <div className="flex flex-col gap-4">
                 <DashboardAction 
                    variant="success" 
                    label={t('common.income')} 
                    onClick={() => handleOpenModal('INCOME')} 
                 />

                 <DashboardAction 
                    variant="primary" 
                    label={t('common.transfers')} 
                    onClick={() => handleOpenModal('TRANSFER')} 
                 />

                 <DashboardAction 
                    variant="danger" 
                    label={t('common.expenses')} 
                    onClick={() => handleOpenModal('EXPENSE')} 
                 />
              </div>

               {/* Accounts List */}
                <Card className="p-6 bg-brand-card rounded-2xl border border-brand-border/30 shadow-lg flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <PageTitle 
                          level={2} 
                          className="text-xl font-bold text-white cursor-pointer hover:text-brand-primary transition-colors"
                          onClick={handleOpenAccountsList}
                        >
                          {t('dashboard.accounts')}
                        </PageTitle>
                        <button 
                        onClick={() => handleOpenAccountForm(null)} 
                        className="text-brand-primary hover:text-brand-primary-hover transition-colors cursor-pointer"
                        title={t('dashboard.newAccount')}
                        >
                        <PlusCircle size={24} />
                        </button>
                    </div>
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                        {accounts.length > 0 ? accounts.map(account => (
                        <div 
                          key={account.id} 
                          className="flex justify-between items-center p-3 rounded-xl bg-brand-dark/30 border border-brand-border/20 hover:border-brand-border/50 transition-colors group cursor-pointer"
                          onClick={() => handleOpenAccountForm(account)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-brand-primary rounded-full"></div>
                                <p className="font-medium text-gray-200 group-hover:text-white transition-colors">{account.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-gray-300 font-mono font-bold">{formatCurrency(account.currentBalance)}</p>
                            </div>
                        </div>
                        )) : <p className="text-gray-400 text-center py-4">{t('dashboard.noAccounts')}</p>}
                    </div>
                </Card>
          </div>
        </div>

        {/* Row 3: Transactions Full Width */}
        <div className="grid grid-cols-1">
            <Card className="p-6 bg-brand-card rounded-2xl border border-brand-border/30 shadow-lg min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                    <PageTitle level={2} className="text-xl font-bold text-white">{t('dashboard.recentTransactions')}</PageTitle>
                    <button 
                        onClick={() => navigate('/transactions')}
                        className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors cursor-pointer"
                    >
                        {t('common.viewAll')}
                    </button>
                </div>
                <TransactionList 
                    transactions={allTransactions.slice(0, 5)} 
                    onEdit={(transaction) => {
                        setTransactionToEdit(transaction);
                        setTransactionModalOpen(true);
                    }}
                    onDelete={async (transaction) => {
                        if (window.confirm(t('dashboard.deleteTransactionConfirm'))) {
                            try {
                                if (isLocalMode) {
                                  const { deleteLocalTransaction } = await import('../services/db');
                                  await deleteLocalTransaction(transaction.id);
                                  fetchAllData();
                                  return;
                                }
                                await api.delete(`/transactions/${transaction.id}`);
                                fetchAllData();
                            } catch (error) {
                                console.error("Error deleting transaction", error);
                            }
                        }
                    }}
                />
            </Card>
        </div>

      </div>

      {/* Modal de Transação */}
      <Modal isOpen={isTransactionModalOpen} onCancel={handleCloseModal}>
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={handleCloseModal}
          transaction={transactionToEdit}
          accounts={accounts}
          categories={categories}
        />
      </Modal>

      {/* Modal de Formulário de Conta (Criar/Editar) */}
      <Modal isOpen={isAccountFormModalOpen} onCancel={handleCloseAccountForm}>
        <PageTitle level={2} className="text-xl font-semibold mb-4 text-white">
          {accountToEdit ? t('dashboard.editAccount') : t('dashboard.newAccount')}
        </PageTitle>
        <AccountForm 
          account={accountToEdit} 
          onSave={handleSaveAccount} 
          onCancel={handleCloseAccountForm}
          onDelete={handleDeleteAccount}
        />
      </Modal>

      {/* All Accounts Modal */}
      <Modal isOpen={isAccountsListModalOpen} onCancel={handleCloseAccountsList}>
        <PageTitle level={2} className="text-xl font-semibold mb-4 text-white">{t('dashboard.allAccounts')}</PageTitle>
        <AccountsListModal 
          accounts={accounts} 
          onEdit={handleOpenAccountForm} 
          onClose={handleCloseAccountsList} 
        />
      </Modal>
    </>
  );
}

export default DashboardPage;