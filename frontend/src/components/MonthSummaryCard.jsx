import React from 'react';
import Card from './ui/Card';
import PageTitle from './ui/PageTitle';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/dateUtils';


function MonthSummaryCard({ title, totalSpent, totalIncome, plannedBudget, className, onClickTitle, onClickPercentage }) {
    const { t } = useTranslation();
    const percentageSpent = plannedBudget > 0 ? (totalSpent / plannedBudget) * 100 : 0;

    return (
        <Card className={`p-6 flex flex-col gap-4 bg-brand-card rounded-2xl border border-brand-border/30 shadow-lg relative overflow-hidden group hover:border-brand-primary/30 transition-colors ${className}`}>
            <div className="flex justify-between items-center">
                <div 
                    className={`${onClickTitle ? 'cursor-pointer transition-opacity hover:opacity-80' : ''}`}
                    onClick={onClickTitle ? onClickTitle : undefined}
                    title={onClickTitle ? t('planning.viewTransactions') : ""}
                >
                    <PageTitle level={3} className="font-bold text-xl text-white">{title}</PageTitle>
                </div>
                <div className="bg-brand-primary/20 p-2 rounded-full text-brand-primary">
                    <Calendar size={20} />
                </div>
            </div>

            <div className="text-sm space-y-3 mt-2">
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('dashboard.totalSpent')}:</span>
                    <span className="font-medium text-white">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('dashboard.income')}:</span>
                    <span className="font-medium text-white">{formatCurrency(totalIncome)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('dashboard.plannedBudget')}:</span>
                    <span className="font-medium text-white">{formatCurrency(plannedBudget)}</span>
                </div>
            </div>

            <div className="mt-auto pt-2">
                <div 
                    className={`${onClickPercentage ? 'cursor-pointer transition-opacity hover:opacity-80' : ''}`}
                    onClick={onClickPercentage ? onClickPercentage : undefined}
                    title={onClickPercentage ? t('common.planning') : ""}
                >
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{t('dashboard.percentageSpent')}:</span>
                        <span className="text-brand-primary font-mono">{percentageSpent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-brand-dark rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${Math.min(percentageSpent, 100)}%` }} 
                        ></div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default MonthSummaryCard;
