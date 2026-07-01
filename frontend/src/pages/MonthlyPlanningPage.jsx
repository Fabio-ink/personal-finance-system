import React, { useState, useEffect, useMemo } from 'react';
import { useCrud } from '../hooks/useCrud';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Checkbox from '../components/ui/Checkbox';
import MonthlyPlanningFormModal from '../components/MonthlyPlanningFormModal';
import MonthlyPlanningFilterModal from '../components/MonthlyPlanningFilterModal';
import { Plus, Filter, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../utils/dateUtils';
import Select from '../components/ui/Select';

function MonthlyPlanningPage({ categories, initialFilters, onNavigateToTransactions }) {
    const { t } = useTranslation();
    const { items: planningEntries, loading, error, addItem, updateItem, deleteMultipleItems, fetchItems, pagination } = useCrud('/monthly-planning');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({
        month: initialFilters?.month || '',
        year: initialFilters?.year || '',
        category: ''
    });

    // Pagination states
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [jumpToPage, setJumpToPage] = useState('');

    useEffect(() => {
        const params = {
            page,
            size: pageSize,
            month: filters.month || undefined,
            year: filters.year || undefined,
            categoryId: filters.category || undefined
        };
        fetchItems(params);
    }, [fetchItems, page, pageSize, filters]);

    const handleJumpToPage = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            const pageNum = parseInt(jumpToPage);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination?.totalPages) {
                setPage(pageNum - 1);
                setJumpToPage('');
            } else if (jumpToPage !== '') {
                // Optional: show error or reset
                setJumpToPage('');
            }
        }
    };

    const [selectedPlanningEntries, setSelectedPlanningEntries] = useState(new Set());

    const handleDeleteSelected = async () => {
        if (window.confirm(t('planning.deleteConfirm'))) {
            await deleteMultipleItems(Array.from(selectedPlanningEntries));
            setSelectedPlanningEntries(new Set());
        }
    };

    const handleSelect = (entryId) => {
        setSelectedPlanningEntries(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(entryId)) {
                newSelected.delete(entryId);
            } else {
                newSelected.add(entryId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPlanningEntries(new Set(planningEntries.map(item => item.id)));
        } else {
            setSelectedPlanningEntries(new Set());
        }
    };

    const isAllSelected = useMemo(() =>
        planningEntries.length > 0 && selectedPlanningEntries.size === planningEntries.length,
        [selectedPlanningEntries.size, planningEntries.length]
    );

    // Removed initial fetchItems useEffect as it is handled by the pagination useEffect


    const handleOpenCreateModal = () => {
        setEditingEntry(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (entry) => {
        setEditingEntry(entry);
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (formData) => {
        const selectedCat = categories.find(c => String(c.id) === String(formData.categoryId));
        const planningData = {
            month: parseInt(formData.month),
            year: parseInt(formData.year),
            category: selectedCat ? { id: selectedCat.id, name: selectedCat.name } : null,
            estimatedAmount: parseFloat(formData.estimatedAmount)
        };

        let resultError = null;
        if (editingEntry) {
            resultError = await updateItem(editingEntry.id, planningData);
        } else {
            resultError = await addItem(planningData);
        }

        if (!resultError) {
            setIsFormModalOpen(false);
            fetchItems(); // Refresh list after add/update
        }
    };

    const getMonthName = (monthNumber) => {
        return t(`months.${monthNumber}`);
    };

    return (
        <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <PageTitle>{t('planning.title')}</PageTitle>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 flex-1 md:flex-none justify-center"
                    >
                        <Filter size={18} />
                        {t('common.filter')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 flex-1 md:flex-none justify-center shadow-lg shadow-brand-primary/20"
                    >
                        <Plus size={18} />
                        {t('planning.newPlanning')}
                    </Button>
                </div>
            </div>

            {selectedPlanningEntries.size > 0 && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-red-200 font-medium pl-2">
                            {selectedPlanningEntries.size} {t('planning.itemsSelected')}
                        </span>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            {t('planning.deleteSelected')}
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : error ? (
                <ErrorMessage message={typeof error === 'string' ? error : error.message || 'An error occurred'} />
            ) : (
                <div className="space-y-4">
                    {planningEntries.length > 0 && (
                        <div className="flex items-center justify-end px-2 mb-2">
                            <Checkbox
                                id="selectAllPlanningEntries"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                label={t('planning.selectAll')}
                            />
                        </div>
                    )}

                    {planningEntries.length > 0 ? (
                        <div className="grid gap-4">
                            {planningEntries.map(entry => {
                                const isInvestment = entry.category?.name?.toLowerCase() === 'investimentos';
                                const spent = entry.spentAmount || 0;
                                const planned = entry.estimatedAmount || 0;
                                const remaining = planned - spent;
                                const percentage = planned > 0 ? (spent / planned) * 100 : 0;
                                const isOverBudget = spent > planned;

                                // Calculate conditional colors
                                let spentColorClass = 'text-white';
                                let remainingColorClass = 'text-brand-success';
                                let percentageColorClass = 'text-brand-primary';
                                let progressBarColorClass = 'bg-brand-primary';

                                if (isInvestment) {
                                    if (isOverBudget) {
                                        spentColorClass = 'text-brand-success';
                                        remainingColorClass = 'text-brand-success';
                                        percentageColorClass = 'text-brand-success';
                                        progressBarColorClass = 'bg-brand-success';
                                    } else {
                                        spentColorClass = 'text-white';
                                        remainingColorClass = 'text-white';
                                        percentageColorClass = 'text-brand-primary';
                                        progressBarColorClass = 'bg-brand-primary';
                                    }
                                } else {
                                    if (isOverBudget) {
                                        spentColorClass = 'text-brand-danger';
                                        remainingColorClass = 'text-brand-danger';
                                        percentageColorClass = 'text-brand-danger';
                                        progressBarColorClass = 'bg-brand-danger';
                                    } else if (percentage >= 70) {
                                        spentColorClass = 'text-brand-warning';
                                        remainingColorClass = 'text-brand-warning';
                                        percentageColorClass = 'text-brand-warning';
                                        progressBarColorClass = 'bg-brand-warning';
                                    } else {
                                        spentColorClass = 'text-white';
                                        remainingColorClass = 'text-brand-success';
                                        percentageColorClass = 'text-brand-primary';
                                        progressBarColorClass = 'bg-brand-primary';
                                    }
                                }

                                return (
                                    <Card
                                        key={entry.id}
                                        className={`group transition-all duration-200 hover:border-brand-primary/30 ${selectedPlanningEntries.has(entry.id) ? 'bg-brand-primary/5 border-brand-primary/30' : ''}`}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <Checkbox
                                                        id={`planningEntry-${entry.id}`}
                                                        checked={selectedPlanningEntries.has(entry.id)}
                                                        onChange={() => handleSelect(entry.id)}
                                                    />
                                                    <div
                                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => {
                                                            if (onNavigateToTransactions) {
                                                                onNavigateToTransactions(entry.month, entry.year, entry.category?.id);
                                                            }
                                                        }}
                                                        title="View related transactions"
                                                    >
                                                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                                            {entry.category?.name ? t(`categories.${entry.category.name.toLowerCase()}`, entry.category.name) : t('common.all')}
                                                            <span className="text-xs font-normal text-gray-400 bg-brand-surface-light px-2 py-0.5 rounded-full border border-brand-border">
                                                                {getMonthName(entry.month)} {entry.year}
                                                            </span>
                                                        </h3>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleOpenEditModal(entry)}
                                                >
                                                    {t('common.edit')}
                                                </Button>
                                            </div>
 
                                            <div
                                                className="grid grid-cols-3 gap-8 mb-4 cursor-pointer"
                                                onClick={() => {
                                                    if (onNavigateToTransactions) {
                                                        onNavigateToTransactions(entry.month, entry.year, entry.category?.id);
                                                    }
                                                }}
                                                title="View related transactions"
                                            >
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{t('planning.spent')}</p>
                                                    <p className={`font-mono font-bold text-lg ${spentColorClass}`}>
                                                        {formatCurrency(spent)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{t('planning.planned')}</p>
                                                    <p className="font-mono font-bold text-lg text-white">
                                                        {formatCurrency(planned)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{t('planning.remaining')}</p>
                                                    <p className={`font-mono font-bold text-lg ${remainingColorClass}`}>
                                                        {formatCurrency(remaining)}
                                                    </p>
                                                </div>
                                            </div>
 
                                            <div className="relative pt-2">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-gray-400 font-medium">{t('planning.progress')}</span>
                                                    <span className={`font-mono font-bold ${percentageColorClass}`}>
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-brand-surface-light rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ease-out ${progressBarColorClass}`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-brand-surface/50 rounded-2xl border border-dashed border-brand-border">
                            <div className="bg-brand-surface-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="text-gray-400" size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{t('planning.noPlanning')}</h3>
                            <p className="text-gray-400 max-w-sm mx-auto">
                                {t('planning.noPlanningDesc')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {pagination && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 bg-brand-surface border border-brand-border p-4 rounded-lg shadow gap-4">
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

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                        <div className="flex items-center mr-4 gap-2">
                            <span className="text-sm text-gray-400">{t('planning.goTo')}:</span>
                            <input
                                type="number"
                                min="1"
                                max={pagination.totalPages}
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                onKeyDown={handleJumpToPage}
                                onBlur={handleJumpToPage}
                                className="w-16 px-2 py-1 text-sm bg-brand-dark border border-brand-border rounded text-white focus:border-brand-primary outline-none"
                                placeholder="#"
                            />
                        </div>
                        <span className="text-sm text-gray-400 mr-2">
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

            <MonthlyPlanningFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingEntry}
                categories={categories}
            />

            <MonthlyPlanningFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
            />
        </div>
    );
}

export default MonthlyPlanningPage;