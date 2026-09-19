import React, { useState, useMemo } from 'react';
import Checkbox from '../ui/Checkbox';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { SquarePen, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SkeletonTable } from '../ui/Skeleton';

const TransactionTable = ({ 
    transactions, 
    selectedTransactions, 
    onSelect, 
    onSelectAll, 
    onEdit, 
    loading, 
    error 
}) => {
    const { t } = useTranslation();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedTransactions = useMemo(() => {
        if (!sortConfig.key || !transactions) return transactions;

        return [...transactions].sort((a, b) => {
            let aVal, bVal;

            switch (sortConfig.key) {
                case 'name':
                    aVal = (a.name || '').toLowerCase();
                    bVal = (b.name || '').toLowerCase();
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);

                case 'amount':
                    aVal = parseFloat(a.amount) || 0;
                    bVal = parseFloat(b.amount) || 0;
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;

                case 'category':
                    aVal = (a.category?.name || '').toLowerCase();
                    bVal = (b.category?.name || '').toLowerCase();
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);

                case 'account':
                    aVal = (a.outAccount?.name || a.inAccount?.name || '').toLowerCase();
                    bVal = (b.outAccount?.name || b.inAccount?.name || '').toLowerCase();
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);

                case 'date':
                    aVal = new Date(a.creationDate).getTime();
                    bVal = new Date(b.creationDate).getTime();
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;

                default:
                    return 0;
            }
        });
    }, [transactions, sortConfig]);

    if (loading) return <SkeletonTable rows={6} cols={7} />;
    if (error) return <ErrorMessage message={error} />;

    const isAllSelected = transactions.length > 0 && selectedTransactions.size === transactions.length;

    const formatValueDisplay = (transaction) => {
        const isExpense = transaction.transactionType === 'EXPENSE';
        const isIncome = transaction.transactionType === 'INCOME';
        const formatted = formatCurrency(transaction.amount);

        if (isExpense) {
            return <span className="text-brand-danger font-semibold font-mono tracking-tight">- {formatted}</span>;
        }
        if (isIncome) {
            return <span className="text-brand-success font-semibold font-mono tracking-tight">+ {formatted}</span>;
        }
        return <span className="text-brand-info font-semibold font-mono tracking-tight">{formatted}</span>;
    };

    const renderHeaderCell = (key, label) => {
        const isActive = sortConfig.key === key;
        const isAsc = sortConfig.direction === 'asc';

        return (
            <th
                onClick={() => handleSort(key)}
                className="py-3 px-3 cursor-pointer select-none group transition-all"
                title={`Ordenar por ${label}`}
            >
                <div 
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                        isActive 
                            ? 'bg-white/20 border border-white/30 shadow-sm text-white font-bold' 
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                    }`}
                >
                    <span className="text-xs uppercase tracking-wider font-semibold">
                        {label}
                    </span>
                    {isActive ? (
                        isAsc ? (
                            <ChevronUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        )
                    ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" />
                    )}
                </div>
            </th>
        );
    };

    return (
        <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 rounded-3xl overflow-hidden shadow-lg">
            {sortedTransactions && sortedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#4d338c] text-white text-xs font-semibold uppercase tracking-wider">
                                <th className="py-4 px-5 w-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <Checkbox id="selectAllTransactions" checked={isAllSelected} onChange={onSelectAll} />
                                    </div>
                                </th>
                                {renderHeaderCell('name', t('transactions.table.name'))}
                                {renderHeaderCell('amount', t('transactions.table.value'))}
                                {renderHeaderCell('category', t('transactions.table.category'))}
                                {renderHeaderCell('account', t('transactions.table.account'))}
                                {renderHeaderCell('date', t('transactions.table.date'))}
                                <th className="py-4 px-5 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/10 text-white">
                            {sortedTransactions.map(transaction => {
                                const isSelected = selectedTransactions.has(transaction.id);
                                return (
                                    <tr 
                                        key={transaction.id} 
                                        className={`transition-colors ${isSelected ? 'bg-brand-primary/15' : 'hover:bg-brand-card-hover/20'}`}
                                    >
                                        <td className="py-4 px-5 text-center">
                                            <div className="flex items-center justify-center">
                                                <Checkbox 
                                                    id={`transaction-${transaction.id}`} 
                                                    checked={isSelected} 
                                                    onChange={() => onSelect(transaction.id)} 
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-sm font-medium text-white">
                                            {transaction.name}
                                        </td>
                                        <td className="py-4 px-5 text-sm">
                                            {formatValueDisplay(transaction)}
                                        </td>
                                        <td className="py-4 px-5 text-sm text-text-secondary">
                                            {transaction.category?.name ? t(`categories.${transaction.category.name.toLowerCase()}`, transaction.category.name) : '-'}
                                        </td>
                                        <td className="py-4 px-5 text-sm text-text-secondary">
                                            {transaction.outAccount?.name || transaction.inAccount?.name || '-'}
                                        </td>
                                        <td className="py-4 px-5 text-sm text-text-secondary">
                                            {formatDate(transaction.creationDate)}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <button 
                                                type="button"
                                                onClick={() => onEdit(transaction)}
                                                className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-brand-card-hover border border-transparent hover:border-brand-border/40 transition-all cursor-pointer inline-flex items-center justify-center"
                                                title={t('common.edit')}
                                            >
                                                <SquarePen className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 px-4">
                    <p className="text-text-secondary text-sm">{t('transactions.table.noTransactions')}</p>
                </div>
            )}
        </div>
    );
};

export default TransactionTable;
