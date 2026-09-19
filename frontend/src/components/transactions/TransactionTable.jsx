import React from 'react';
import Checkbox from '../ui/Checkbox';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { SquarePen } from 'lucide-react';
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

    return (
        <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 rounded-3xl overflow-hidden shadow-lg">
            {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#4d338c] text-white text-xs font-semibold uppercase tracking-wider">
                                <th className="py-4 px-5 w-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <Checkbox id="selectAllTransactions" checked={isAllSelected} onChange={onSelectAll} />
                                    </div>
                                </th>
                                <th className="py-4 px-5">{t('transactions.table.name')}</th>
                                <th className="py-4 px-5">{t('transactions.table.value')}</th>
                                <th className="py-4 px-5">{t('transactions.table.category')}</th>
                                <th className="py-4 px-5">{t('transactions.table.account')}</th>
                                <th className="py-4 px-5">{t('transactions.table.date')}</th>
                                <th className="py-4 px-5 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/10 text-white">
                            {transactions.map(transaction => {
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
