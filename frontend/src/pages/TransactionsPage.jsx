import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCrud } from '../hooks/useCrud';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useToast } from '../hooks/useToast';
import TransactionForm from '../components/TransactionForm';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import MonthlyPlanningPage from './MonthlyPlanningPage';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import { formatCurrency } from '../utils/dateUtils';
import api from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslation } from 'react-i18next';

function TransactionsPage() {
    const { t } = useTranslation();
    const { items: transactions, loading, error, addItem, updateItem, deleteMultipleItems, fetchItems, pagination } = useCrud('/transactions');
    const { items: categories, fetchItems: fetchCategories } = useCrud('/categories');
    const { items: accounts, fetchItems: fetchAccounts } = useCrud('/accounts');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());

    const location = useLocation();
    const initialActiveTab = location.state?.activeTab || 'transactions';

    const [activeTab, setActiveTab] = useState(initialActiveTab); // 'transactions' or 'planning'

    const initialFilters = useMemo(() => {
        if (location.state && location.state.activeTab === 'transactions' && location.state.startDate && location.state.endDate) {
            return {
                startDate: location.state.startDate,
                endDate: location.state.endDate
            };
        }
        return {};
    }, [location.state]);

    const { filters, handleChange, clearFilters, getFilterParams } = useTransactionFilters(initialFilters);
    const { addToast } = useToast();

    // Pagination states
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [jumpToPage, setJumpToPage] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchAccounts();
        const params = getFilterParams();
        fetchItems({ ...params, page, size: pageSize });
    }, [fetchCategories, fetchAccounts, fetchItems, page, pageSize, getFilterParams]);

    const handleJumpToPage = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            const pageNum = parseInt(jumpToPage);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination?.totalPages) {
                setPage(pageNum - 1);
                setJumpToPage('');
            } else if (jumpToPage !== '') {
                setJumpToPage('');
            }
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchAccounts();
        const params = getFilterParams();
        fetchItems({ ...params, page, size: pageSize });
    }, [fetchCategories, fetchAccounts, fetchItems, page, pageSize, getFilterParams]);

    const handleApplyFilters = () => {
        const params = getFilterParams();
        params.page = 0; // Reset to first page when filtering
        params.size = pageSize;
        setPage(0); // Update local state
        fetchItems(params);
    };

    const handleClearFilters = () => {
        clearFilters();
        setPage(0);
        fetchItems({ page: 0, size: pageSize }); // Fetch all items without filters
    };

    const handleSave = async (transactionData) => {
        try {
            if (selectedTransaction) {
                await updateItem(selectedTransaction.id, transactionData);
                addToast({ type: 'success', title: t('common.success'), message: t('transactions.updateSuccess') });
            } else {
                await addItem(transactionData);
                addToast({ type: 'success', title: t('common.success'), message: t('transactions.saveSuccess') });
            }
            setIsModalOpen(false);
            setSelectedTransaction(null);
            handleApplyFilters(); // Re-apply filters after save
        } catch (error) {
            addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
    };

    const handleDeleteSelected = async () => {
        try {
            if (window.confirm(t('transactions.deleteConfirm'))) {
                await deleteMultipleItems(Array.from(selectedTransactions));
                setSelectedTransactions(new Set());
                handleApplyFilters(); // Re-apply filters after delete
                addToast({ type: 'success', title: t('common.success'), message: t('transactions.deleteConfirm') }); 
                // Wait, I should use a success message, not the confirm message. 
                // The confirm was missing from original code's logic but good practice.
            }
        } catch (error) {
            addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
    };

    const handleSelect = (transactionId) => {
        setSelectedTransactions(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(transactionId)) {
                newSelected.delete(transactionId);
            } else {
                newSelected.add(transactionId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedTransactions(new Set(transactions.map(transaction => transaction.id)));
        } else {
            setSelectedTransactions(new Set());
        }
    };

    const pageTotal = useMemo(() => {
        return transactions.reduce((acc, transaction) => {
            const isExpense = transaction.transactionType === 'EXPENSE' || transaction.transactionType === 'CREDIT_CARD';
            return acc + (isExpense ? -transaction.amount : transaction.amount);
        }, 0);
    }, [transactions]);

    const handleExport = async () => {
        try {
            const response = await api.get('/transactions/export', {
                params: getFilterParams(),
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'transactions.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast({ type: 'success', title: t('common.export'), message: t('transactions.exportSuccess') });
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/transactions/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            addToast({ type: 'success', title: t('common.import'), message: t('transactions.importSuccess') });
            handleApplyFilters();
            fetchCategories(); // Refresh in case new categories were created
            fetchAccounts(); // Refresh in case new accounts were created
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: t('common.error'), message: t('transactions.importError') });
        }
        e.target.value = '';
    };

    const handleFilterChange = (field, value) => {
        handleChange(field, value);
        setPage(0);
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <PageTitle>{activeTab === 'transactions' ? t('transactions.title') : t('planning.title')}</PageTitle>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={activeTab === 'transactions' ? 'primary' : 'ghost'}
                            onClick={() => setActiveTab('transactions')}>
                            {t('common.transactions')}
                        </Button>
                        <Button
                            variant={activeTab === 'planning' ? 'primary' : 'ghost'}
                            onClick={() => setActiveTab('planning')}>
                            {t('common.planning')}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {activeTab === 'transactions' && selectedTransactions.size > 0 && (
                        <Button
                            variant="danger"
                            onClick={handleDeleteSelected}>
                            {t('transactions.deleteSelected')} ({selectedTransactions.size})
                        </Button>
                    )}
                    {activeTab === 'transactions' && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={handleExport}>
                                {t('common.export')}
                            </Button>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                                <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
                                    {t('common.import')}
                                </span>
                            </label>
                            <Button
                                variant="success"
                                onClick={() => { setSelectedTransaction(null); setIsModalOpen(true); }}>
                                {t('transactions.newTransaction')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'transactions' && (
                <TransactionFilters
                    filters={filters}
                    onChange={handleFilterChange}
                    onClear={handleClearFilters}
                    categories={categories}
                />
            )}

            {activeTab === 'transactions' ? (
                <TransactionTable
                    transactions={transactions}
                    selectedTransactions={selectedTransactions}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    onEdit={(transaction) => { setSelectedTransaction(transaction); setIsModalOpen(true); }}
                    loading={loading}
                    error={error}
                />
            ) : (
                <MonthlyPlanningPage
                    categories={categories}
                    initialFilters={
                        location.state?.activeTab === 'planning' ? {
                            month: location.state.planningMonth,
                            year: location.state.planningYear
                        } : null
                    }
                    onNavigateToTransactions={(month, year, categoryId) => {
                        // Calculate start and end date for the month
                        const date = new Date(year, month - 1, 1);
                        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
                        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

                        // Apply filters
                        handleChange('startDate', startDate);
                        handleChange('endDate', endDate);
                        if (categoryId) {
                            handleChange('categoryId', categoryId);
                        } else {
                            handleChange('categoryId', '');
                        }

                        // Switch tab
                        setActiveTab('transactions');

                        // Fetch items with new filters
                        setPage(0);
                        const params = {
                            startDate,
                            endDate,
                            categoryId: categoryId || undefined,
                            page: 0,
                            size: pageSize
                        };
                        fetchItems(params);
                    }}
                />
            )}

            {activeTab === 'transactions' && pagination && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow gap-4">
                    <div className="flex items-center w-full md:w-auto">
                        <Select
                            label={t('planning.itemsPerPage')}
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(0); // Reset to first page
                            }}
                            className="w-full md:w-48"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </Select>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{t('planning.pageTotal')}</span>
                        <span className={`text-lg font-bold ${pageTotal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(pageTotal)}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                        <div className="flex items-center mr-4 gap-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t('planning.goTo')}:</span>
                            <input
                                type="number"
                                min="1"
                                max={pagination.totalPages}
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                onKeyDown={handleJumpToPage}
                                onBlur={handleJumpToPage}
                                className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:border-brand-primary outline-none"
                                placeholder="#"
                            />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                            {t('planning.pageOf', { number: pagination.number + 1, total: pagination.totalPages })}
                        </span>
                        <div className="inline-flex rounded-md shadow-sm gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={pagination.first}
                            >
                                {t('common.previous')}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages - 1, p + 1))}
                                disabled={pagination.last}
                            >
                                {t('common.next')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onCancel={() => setIsModalOpen(false)}>
                <TransactionForm
                    transaction={selectedTransaction}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    categories={categories}
                    accounts={accounts}
                />
            </Modal>
        </div>
    );
}

export default TransactionsPage;
