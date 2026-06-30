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
        <Card className="mb-4 p-4 bg-brand-card/80 backdrop-blur-sm border border-brand-border/30">
            <div className="flex justify-between items-center mb-4">
                <PageTitle level={3} className="text-lg font-semibold text-white">{t('transactions.filterTitle')}</PageTitle>
                <Button 
                    onClick={onClear}
                    className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/50 text-xs px-3 py-1 h-8 uppercase tracking-wider font-bold transition-all"
                >
                    {t('transactions.clearFilters')}
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <Input 
                    label={t('transactions.name')}
                    type="text"
                    value={filters.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    placeholder={t('transactions.filterByName')}
                />
                <DatePicker 
                    label={t('transactions.startDate')}
                    value={filters.startDate}
                    onChange={(e) => onChange('startDate', e.target.value)}
                />
                <DatePicker 
                    label={t('transactions.endDate')}
                    value={filters.endDate}
                    onChange={(e) => onChange('endDate', e.target.value)}
                />
                <Select
                    label={t('transactions.category')}
                    value={filters.categoryId}
                    onChange={(e) => onChange('categoryId', e.target.value)}
                >
                    <option value="">{t('transactions.allCategories')}</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{t(`categories.${category.name.toLowerCase()}`, category.name)}</option>
                    ))}
                </Select>
                <Select
                    label={t('transactions.type')}
                    value={filters.transactionType}
                    onChange={(e) => onChange('transactionType', e.target.value)}
                >
                    <option value="">{t('transactions.allTypes')}</option>
                    <option value="INCOME">{t('common.income')}</option>
                    <option value="EXPENSE">{t('common.expense')}</option>
                    <option value="TRANSFER">{t('common.transfer')}</option>
                    <option value="CREDIT_CARD">{t('common.creditCard')}</option>
                </Select>
            </div>
        </Card>
    );
};

export default TransactionFilters;
