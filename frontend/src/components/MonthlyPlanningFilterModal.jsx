import React from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function MonthlyPlanningFilterModal({ isOpen, onClose, filters, setFilters, categories }) {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: t(`months.${i + 1}`)
    }));

    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setFilters({
            month: '',
            year: '',
            category: ''
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-brand-border/50">
                    <h2 className="text-xl font-bold text-white">{t('planning.filterTitle')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label={t('planning.form.month')} 
                            value={filters.month} 
                            onChange={(e) => handleChange('month', e.target.value)}
                        >
                            <option value="">{t('common.all')}</option>
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </Select>
                        <Input 
                            label={t('planning.form.year')} 
                            type="number" 
                            value={filters.year} 
                            onChange={(e) => handleChange('year', e.target.value)} 
                        />
                    </div>
                    
                    <Select 
                        label={t('planning.form.category')} 
                        value={filters.category} 
                        onChange={(e) => handleChange('category', e.target.value)}
                    >
                        <option value="">{t('common.all')}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </Select>

                    <div className="pt-4 flex gap-3 justify-between">
                        <Button type="button" variant="ghost" onClick={handleClear} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            {t('planning.clearFilters')}
                        </Button>
                        <Button type="button" variant="primary" onClick={onClose}>
                            {t('common.filter')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonthlyPlanningFilterModal;
