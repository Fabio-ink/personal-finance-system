import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCrud } from '../hooks/useCrud';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import TransactionForm from '../components/TransactionForm';
import Button from '../components/ui/Button';
import PageTitle from '../components/ui/PageTitle';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import ImportModal from '../components/transactions/ImportModal';
import { formatCurrency } from '../utils/dateUtils';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { ChevronDown, FileText, FileSpreadsheet, UploadCloud, Plus, Trash2 } from 'lucide-react';

function TransactionsPage() {
    const { t } = useTranslation();
    const { isLocalMode } = useAuth();
    const { items: transactions, loading, error, addItem, updateItem, deleteMultipleItems, fetchItems, pagination } = useCrud('/transactions');
    const { items: categories, fetchItems: fetchCategories } = useCrud('/categories');
    const { items: accounts, fetchItems: fetchAccounts } = useCrud('/accounts');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
    const [defaultFileType, setDefaultFileType] = useState('');

    const importDropdownRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (importDropdownRef.current && !importDropdownRef.current.contains(event.target)) {
                setIsImportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initialFilters = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryCategoryId = searchParams.get('categoryId') || searchParams.get('category') || '';
        const queryStartDate = searchParams.get('startDate') || '';
        const queryEndDate = searchParams.get('endDate') || '';

        const state = location.state || {};
        return {
            startDate: state.startDate || queryStartDate || '',
            endDate: state.endDate || queryEndDate || '',
            categoryId: state.categoryId ? String(state.categoryId) : (queryCategoryId ? String(queryCategoryId) : ''),
            name: state.name || '',
            transactionType: state.transactionType || ''
        };
    }, [location.state, location.search]);

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

    const handleApplyFilters = () => {
        const params = getFilterParams();
        params.page = 0;
        params.size = pageSize;
        setPage(0);
        fetchItems(params);
    };

    const handleClearFilters = () => {
        clearFilters();
        setPage(0);
        fetchItems({ page: 0, size: pageSize });
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
            handleApplyFilters();
        } catch {
            addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
        }
    };

    const handleDeleteSelected = async () => {
        try {
            if (window.confirm(t('transactions.deleteConfirm'))) {
                await deleteMultipleItems(Array.from(selectedTransactions));
                setSelectedTransactions(new Set());
                handleApplyFilters();
                addToast({ type: 'success', title: t('common.success'), message: t('transactions.deleteConfirm') }); 
            }
        } catch {
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
            const isExpense = transaction.transactionType === 'EXPENSE';
            return acc + (isExpense ? -transaction.amount : transaction.amount);
        }, 0);
    }, [transactions]);

    const handleExport = async () => {
        if (isLocalMode) {
            addToast({ type: 'error', title: t('common.error'), message: 'A exportação de Excel não está disponível no Modo Local.' });
            return;
        }
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

    const handleFilterChange = (field, value) => {
        handleChange(field, value);
        setPage(0);
    };

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                    <PageTitle>{t('transactions.title')}</PageTitle>
                </div>
                <div className="flex items-center flex-wrap gap-2.5">
                    {selectedTransactions.size > 0 && (
                        <button
                            type="button"
                            onClick={handleDeleteSelected}
                            className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('transactions.deleteSelected')} ({selectedTransactions.size})</span>
                        </button>
                    )}

                    {/* Import Dropdown with all import options */}
                    <div className="relative z-30" ref={importDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                            className="bg-brand-dark/50 border border-brand-border/40 text-text-secondary hover:text-white hover:border-brand-border hover:bg-brand-card/60 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <span>{t('common.import')}</span>
                            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isImportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-brand-card/95 border border-brand-border text-white shadow-2xl backdrop-blur-md rounded-2xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDefaultFileType('ofx');
                                        setIsImportModalOpen(true);
                                        setIsImportDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                                    <div>
                                        <div className="font-medium">Importar OFX</div>
                                        <div className="text-xs text-text-muted">Extrato bancário (.ofx)</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDefaultFileType('excel');
                                        setIsImportModalOpen(true);
                                        setIsImportDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-brand-success shrink-0" />
                                    <div>
                                        <div className="font-medium">Importar Excel</div>
                                        <div className="text-xs text-text-muted">Planilha (.xlsx, .xls)</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleExport}
                        className="bg-brand-dark/50 border border-brand-border/40 text-text-secondary hover:text-white hover:border-brand-border hover:bg-brand-card/60 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-md"
                    >
                        {t('common.export')}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setSelectedTransaction(null); setIsModalOpen(true); }}
                        className="bg-brand-success hover:bg-brand-success-hover text-brand-dark font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-brand-success/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>{t('transactions.newTransaction')}</span>
                    </button>
                </div>
            </div>

            <TransactionFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                categories={categories}
            />

            <TransactionTable
                transactions={transactions}
                selectedTransactions={selectedTransactions}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onEdit={(transaction) => { setSelectedTransaction(transaction); setIsModalOpen(true); }}
                loading={loading}
                error={error}
            />

            {pagination && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-6 bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-5 rounded-3xl shadow-lg gap-4">
                    <div className="flex items-center w-full md:w-auto">
                        <Select
                            label={t('planning.itemsPerPage')}
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(0);
                            }}
                            className="w-full md:w-48"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </Select>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">{t('planning.pageTotal')}</span>
                        <span className={`text-lg font-bold font-mono ${pageTotal < 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
                            {formatCurrency(pageTotal)}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                        <div className="flex items-center mr-4 gap-2">
                            <span className="text-sm text-text-secondary">{t('planning.goTo')}:</span>
                            <input
                                type="number"
                                min="1"
                                max={pagination.totalPages}
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                onKeyDown={handleJumpToPage}
                                onBlur={handleJumpToPage}
                                className="w-16 px-2 py-1 text-sm bg-brand-dark/50 border border-brand-border/30 focus:border-brand-primary rounded-xl text-white outline-none font-mono"
                                placeholder="#"
                            />
                        </div>
                        <span className="text-sm text-text-secondary mr-2">
                            {t('planning.pageOf', { number: pagination.number + 1, total: pagination.totalPages })}
                        </span>
                        <div className="inline-flex rounded-md gap-2">
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

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                accounts={accounts}
                categories={categories}
                fetchCategories={fetchCategories}
                fetchAccounts={fetchAccounts}
                onSuccess={handleApplyFilters}
                isLocalMode={isLocalMode}
                defaultFileType={defaultFileType}
            />
        </div>
    );
}

export default TransactionsPage;
