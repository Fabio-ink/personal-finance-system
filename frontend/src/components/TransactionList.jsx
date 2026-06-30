import { Edit2, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import IconButton from './ui/IconButton';
import { useTranslation } from 'react-i18next';

// formatDate is imported from utils

function TransactionList({ transactions, onEdit, onDelete }) {
    const { t } = useTranslation();
    if (!transactions || transactions.length === 0) {
        return <p className="text-text-secondary text-center py-8">{t('dashboard.noTransactions')}</p>;
    }

    // Take only the last 5 transactions for the dashboard
    const recentTransactions = [...transactions].sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)).slice(0, 5);

    return (
        <div className="space-y-3">
            {recentTransactions.map((transaction) => (
                <div 
                    key={transaction.id} 
                    className="group flex items-center justify-between p-4 rounded-xl bg-brand-dark/30 border border-brand-border/20 hover:border-brand-primary/30 hover:bg-brand-dark/50 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${
                            transaction.transactionType === 'INCOME' ? 'bg-brand-success' : 
                            transaction.transactionType === 'EXPENSE' ? 'bg-brand-danger' : 'bg-brand-info'
                        }`}></div>
                        
                        <div>
                            <p className="font-semibold text-white">{transaction.name}</p>
                            <p className="text-xs text-text-secondary">{formatDate(transaction.creationDate)} • {transaction.category?.name ? t(`categories.${transaction.category.name.toLowerCase()}`, transaction.category.name) : t('transactions.form.selectCategory')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className={`font-bold font-mono ${
                            transaction.transactionType === 'INCOME' ? 'text-brand-success' : 
                            transaction.transactionType === 'EXPENSE' ? 'text-brand-danger' : 'text-brand-info'
                        }`}>
                            {transaction.transactionType === 'EXPENSE' ? '- ' : '+ '}
                            {formatCurrency(transaction.amount)}
                        </span>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton 
                                onClick={() => onEdit(transaction)}
                                color="primary"
                                title={t('common.edit')}
                            >
                                <Edit2 size={16} />
                            </IconButton>
                            <IconButton 
                                onClick={() => onDelete && onDelete(transaction)}
                                color="danger"
                                title={t('common.delete')}
                            >
                                <Trash2 size={16} />
                            </IconButton>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TransactionList;
