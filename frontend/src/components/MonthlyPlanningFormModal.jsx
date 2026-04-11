import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function MonthlyPlanningFormModal({ isOpen, onClose, onSubmit, initialData, categories }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        categoryId: '',
        estimatedAmount: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    month: initialData.month,
                    year: initialData.year,
                    categoryId: initialData.category?.id || '',
                    estimatedAmount: initialData.estimatedAmount
                });
            } else {
                setFormData({
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    categoryId: '',
                    estimatedAmount: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: t(`months.${i + 1}`)
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-brand-border/50">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? t('planning.editPlanning') : t('planning.newPlanning')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select name="month" label={t('planning.form.month')} value={formData.month} onChange={handleChange} required>
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </Select>
                        <Input name="year" label={t('planning.form.year')} type="number" value={formData.year} onChange={handleChange} required />
                    </div>
                    
                    <Select name="categoryId" label={t('planning.form.category')} value={formData.categoryId} onChange={handleChange}>
                        <option value="">{t('planning.form.selectCategory')}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </Select>
                    
                    <Input 
                        name="estimatedAmount" 
                        label={t('planning.form.amount')} 
                        type="number" 
                        step="0.01" 
                        value={formData.estimatedAmount} 
                        onChange={handleChange} 
                        placeholder="0.00" 
                        required 
                    />

                    <div className="pt-4 flex gap-3 justify-end">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" variant="primary">
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MonthlyPlanningFormModal;
