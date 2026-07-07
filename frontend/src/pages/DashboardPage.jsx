import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction, updateTransaction } from '../services/api'; 
import { useAuth } from '../contexts/AuthContext'; 
import TransactionChart from '../components/TransactionChart';
import Card from '../components/ui/Card';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import Modal from '../components/ui/Modal';
import PageTitle from '../components/ui/PageTitle';
import DashboardAction from '../components/DashboardAction';
import AccountBalanceCarousel from '../components/AccountBalanceCarousel';
import { formatCurrency } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { ptBR, enUS } from 'date-fns/locale';
import api from '../services/api';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getLocalTransactions, getCachedAccounts, getCachedCategories } from '../services/db';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
        } else if (t.transactionType === 'EXPENSE') {
          totalSpent += amt;
        }
      }
    });

    return { totalSpent, totalIncome, plannedBudget: 0 };
  };

  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

  return {
    previous: getMonthData(previousMonth),
    current: getMonthData(currentMonth),
  };
};

const mergeSummaryWithLocalUnsynced = (serverSummary, localTransactions) => {
  if (!serverSummary) return null;
  const unsynced = localTransactions.filter(t => !t.synced);
  if (unsynced.length === 0) return serverSummary;

  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

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
        } else if (t.transactionType === 'EXPENSE') {
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
    previous: applyUnsyncedToMonth(serverSummary.previous, previousMonth),
    current: applyUnsyncedToMonth(serverSummary.current, currentMonth),
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

  const dateLocale = i18n.language.startsWith('pt') ? ptBR : enUS;
  const currentMonth = new Date();
  const currentMonthName = format(currentMonth, 'MMMM', { locale: dateLocale });
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
            } else if (t.transactionType === 'EXPENSE') {
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
        api.get('/transactions?size=500'),     
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

  const incomeVariation = useMemo(() => {
    if (!monthlySummary?.current || !monthlySummary?.previous) return null;
    const prev = monthlySummary.previous.totalIncome || 0;
    if (prev === 0) return null;
    return ((monthlySummary.current.totalIncome - prev) / prev * 100).toFixed(0);
  }, [monthlySummary]);

  const expenseVariation = useMemo(() => {
    if (!monthlySummary?.current || !monthlySummary?.previous) return null;
    const prev = monthlySummary.previous.totalSpent || 0;
    if (prev === 0) return null;
    return ((monthlySummary.current.totalSpent - prev) / prev * 100).toFixed(0);
  }, [monthlySummary]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <>
      <div className="container mx-auto space-y-8 p-4">

        {/* Row 1: Summary Cards */}
        <div>
          <p className="text-sm text-gray-400 mb-4">
            {t('dashboard.currentMonth')} ({capitalize(currentMonthName)})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Available Balance (Main Account) */}
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg min-w-0">
              <p className="text-lg font-bold uppercase tracking-wider text-brand-primary mb-2">
                {t('dashboard.availableBalance')}
              </p>
              <AccountBalanceCarousel accounts={accounts} formatCurrency={formatCurrency} />
            </div>

            {/* Card 2: Monthly Income */}
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <p className="text-lg font-bold uppercase tracking-wider text-green-500 mb-2">
                {t('dashboard.monthlyIncome')}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatCurrency(monthlySummary?.current?.totalIncome || 0)}
              </h3>
              {incomeVariation !== null && (
                <p className={`mt-2 text-xs flex items-center gap-1 ${Number(incomeVariation) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {Number(incomeVariation) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Number(incomeVariation) >= 0 ? '+' : ''}{incomeVariation}% {t('dashboard.comparedToPreviousMonth')}
                </p>
              )}
            </div>

            {/* Card 3: Monthly Expenses */}
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <p className="text-lg font-bold uppercase tracking-wider text-red-500 mb-2">
                {t('dashboard.monthlyExpenses')}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatCurrency(monthlySummary?.current?.totalSpent || 0)}
              </h3>
              {expenseVariation !== null && (
                <p className={`mt-2 text-xs flex items-center gap-1 ${Number(expenseVariation) <= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {Number(expenseVariation) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Number(expenseVariation) >= 0 ? '+' : ''}{expenseVariation}% {t('dashboard.comparedToPreviousMonth')}
                </p>
              )}
            </div>

          </div>
        </div>
        
        {/* Row 2: Actions (left) + Chart (right) */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Left Column: Actions */}
          <div className="flex flex-col gap-4 lg:w-[380px] shrink-0">
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

          {/* Right Column: Chart */}
          <div className="flex-1 min-h-[300px]">
            <Card className="p-6 h-full flex flex-col bg-brand-card rounded-2xl border border-brand-border/30 shadow-lg">
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
        </div>

        {/* Row 3: Recent Transactions */}
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

      {/* Transaction Modal */}
      <Modal isOpen={isTransactionModalOpen} onCancel={handleCloseModal}>
        <TransactionForm
          onSave={handleSaveTransaction}
          onCancel={handleCloseModal}
          transaction={transactionToEdit}
          accounts={accounts}
          categories={categories}
        />
      </Modal>
    </>
  );
}

export default DashboardPage;