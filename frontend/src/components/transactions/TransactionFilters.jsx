import React from 'react';
import Card from '../ui/Card';
import PageTitle from '../ui/PageTitle';
import Input from '../ui/Input';
import DatePicker from '../ui/DatePicker';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useTranslation } from 'react-i18next';

const TransactionFilters = ({ filters, onChange, onClear, categories }) => {
    const { t } = useTranslation();
    return (
        <div className="relative z-30 mb-6 p-6 bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-white tracking-wide">{t('transactions.filterTitle')}</h3>
                <button 
                    type="button"
                    onClick={onClear}
                    className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/40 text-xs px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                    {t('transactions.clearFilters')}
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <Input 
                    label={t('transactions.name')}
                    type="text"
                    value={filters.name || ''}
                    onChange={(e) => onChange('name', e.target.value)}
                    placeholder={t('transactions.filterByName')}
                />
                <DatePicker 
                    label={t('transactions.startDate')}
                    value={filters.startDate || ''}
                    onChange={(e) => onChange('startDate', e.target.value)}
                />
                <DatePicker 
                    label={t('transactions.endDate')}
                    value={filters.endDate || ''}
                    onChange={(e) => onChange('endDate', e.target.value)}
                />
                <Select
                    label={t('transactions.category')}
                    value={filters.categoryId || ''}
                    onChange={(e) => onChange('categoryId', e.target.value)}
                >
                    <option value="">{t('transactions.allCategories')}</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{t(`categories.${category.name.toLowerCase()}`, category.name)}</option>
                    ))}
                </Select>
                <Select
                    label={t('transactions.type')}
                    value={filters.transactionType || ''}
                    onChange={(e) => onChange('transactionType', e.target.value)}
                >
                    <option value="">{t('transactions.allTypes')}</option>
                    <option value="INCOME">{t('common.income')}</option>
                    <option value="EXPENSE">{t('common.expense')}</option>
                    <option value="TRANSFER">{t('common.transfer')}</option>
                </Select>
            </div>
        </div>
    );
};

export default TransactionFilters;
