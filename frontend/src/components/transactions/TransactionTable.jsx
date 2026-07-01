import React from 'react';
import Card from '../ui/Card';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

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
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error} />;

    const isAllSelected = transactions.length > 0 && selectedTransactions.size === transactions.length;

    return (
        <Card className="overflow-hidden">
            {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    <Checkbox id="selectAllTransactions" checked={isAllSelected} onChange={onSelectAll} />
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('transactions.table.name')}</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('transactions.table.value')}</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('transactions.table.category')}</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('transactions.table.account')}</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('transactions.table.date')}</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                            {transactions.map(transaction => (
                                <tr key={transaction.id} className={`dark:bg-gray-800 ${selectedTransactions.has(transaction.id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                        <Checkbox id={`transaction-${transaction.id}`} checked={selectedTransactions.has(transaction.id)} onChange={() => onSelect(transaction.id)} />
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                        <p className="text-gray-900 dark:text-gray-200 whitespace-no-wrap">{transaction.name}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                        <p className={`whitespace-no-wrap ${transaction.transactionType === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                         <p className="text-gray-900 dark:text-gray-200 whitespace-no-wrap">{transaction.category?.name ? t(`categories.${transaction.category.name.toLowerCase()}`, transaction.category.name) : 'N/A'}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                        <p className="text-gray-900 dark:text-gray-200 whitespace-no-wrap">{transaction.outAccount?.name || transaction.inAccount?.name || 'N/A'}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm">
                                        <p className="text-gray-900 dark:text-gray-200 whitespace-no-wrap">{formatDate(transaction.creationDate)}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                                        <Button 
                                            variant="warning"
                                            size="sm"
                                            onClick={() => onEdit(transaction)}>{t('common.edit')}</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center p-6">
                    <p className="text-gray-500 dark:text-gray-400">{t('transactions.table.noTransactions')}</p>
                </div>
            )}
        </Card>
    );
};

export default TransactionTable;
