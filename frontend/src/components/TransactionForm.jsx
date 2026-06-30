import { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import PageTitle from './ui/PageTitle';
import { useTranslation } from 'react-i18next';

import DatePicker from './ui/DatePicker';
const getTodayLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function TransactionForm({ transaction, onSave, onCancel, categories, accounts }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        // Initialize with local date string YYYY-MM-DD
        // Initialize with local date string YYYY-MM-DD
        creationDate: getTodayLocalDateString(),
        transactionType: 'EXPENSE',
        categoryId: '',
        outAccountId: '',
        inAccountId: '',
        totalInstallments: 1
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (transaction) {
            setFormData({
                name: transaction.name || '',
                amount: transaction.amount || '',
                creationDate: transaction.creationDate ? (() => {
                    // Start of day in local time from the UTC string provided by backend or ensure YYYY-MM-DD
                    // Assuming transaction.creationDate is YYYY-MM-DD string based on current usage.
                    return transaction.creationDate.split('T')[0];
                })() : getTodayLocalDateString(),
                transactionType: transaction.transactionType || 'EXPENSE',
                categoryId: transaction.category?.id || '',
                outAccountId: transaction.outAccount?.id || '',
                inAccountId: transaction.inAccount?.id || '',
                totalInstallments: transaction.totalInstallments || 1
            });
        } else {
            setFormData({
                name: '',
                amount: '',
                creationDate: getTodayLocalDateString(),
                transactionType: 'EXPENSE',
                categoryId: '',
                outAccountId: '',
                inAccountId: '',
                totalInstallments: 1
            });
        }
    }, [transaction]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const errors = {};
        if (parseFloat(formData.amount) <= 0) {
            errors.amount = t('transactions.validation.amountPositive');
        }
        if (!formData.name) {
            errors.name = t('transactions.validation.nameRequired');
        }
        if (!formData.creationDate) {
            errors.date = t('transactions.validation.dateRequired');
        }

        // Validation for Expense (EXPENSE)
        if (formData.transactionType === 'EXPENSE') {
            if (!formData.categoryId) errors.category = t('transactions.validation.categoryRequired');
            if (!formData.outAccountId) errors.outAccount = t('transactions.validation.accountRequired');
        }

        // Validation for Credit Card (CREDIT_CARD)
        if (formData.transactionType === 'CREDIT_CARD') {
             if (!formData.categoryId) errors.category = t('transactions.validation.categoryRequired');
             if (!formData.outAccountId) errors.outAccount = t('transactions.validation.accountRequired');
        }

        // Validation for Transfer (TRANSFER)
        if (formData.transactionType === 'TRANSFER') {
            if (!formData.outAccountId) errors.outAccount = t('transactions.validation.accountRequired');
            if (!formData.inAccountId) errors.inAccount = t('transactions.validation.accountRequired');
        }

        // Validation for Income (INCOME)
        if (formData.transactionType === 'INCOME') {
            if (!formData.inAccountId) errors.inAccount = t('transactions.validation.accountRequired');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submissionData = {
            name: formData.name,
            amount: parseFloat(formData.amount),
            creationDate: formData.creationDate,
            transactionType: formData.transactionType,
            category: formData.categoryId ? { id: String(formData.categoryId).startsWith('local_') ? formData.categoryId : parseInt(formData.categoryId) } : null,
            outAccount: formData.outAccountId ? { id: String(formData.outAccountId).startsWith('local_') ? formData.outAccountId : parseInt(formData.outAccountId) } : null,
            inAccount: formData.inAccountId ? { id: String(formData.inAccountId).startsWith('local_') ? formData.inAccountId : parseInt(formData.inAccountId) } : null,
            totalInstallments: formData.transactionType === 'CREDIT_CARD' ? parseInt(formData.totalInstallments) : 1
        };
        
        if (transaction && transaction.id) {
            submissionData.id = transaction.id;
        }

        onSave(submissionData);
    };


    return (
        <div>
            <PageTitle level={2} className="mb-6">
                {transaction ? t('transactions.editTransaction') : (formData.transactionType === 'CREDIT_CARD' ? t('transactions.creditCardExpense') : t('transactions.newTransaction'))}
            </PageTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Input name="name" label={t('transactions.form.name')} value={formData.name} onChange={handleChange} placeholder={t('transactions.form.name')} required />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                    <Input name="amount" label={t('transactions.form.amount')} type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="0.00" required />
                    {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>
                <div>
                    <DatePicker name="creationDate" label={t('transactions.form.date')} value={formData.creationDate} onChange={handleChange} required />
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                </div>
                
                {formData.transactionType !== 'CREDIT_CARD' && (
                    <Select name="transactionType" label={t('transactions.form.type')} value={formData.transactionType} onChange={handleChange}>
                        <option value="EXPENSE">{t('common.expense')}</option>
                        <option value="INCOME">{t('common.income')}</option>
                        <option value="TRANSFER">{t('common.transfer')}</option>
                        <option value="CREDIT_CARD">{t('common.creditCard')}</option>
                    </Select>
                )}
                
                {formData.transactionType === 'CREDIT_CARD' && (
                    <div>
                        <Input name="totalInstallments" label={t('transactions.form.installments')} type="number" min="1" value={formData.totalInstallments} onChange={handleChange} required />
                    </div>
                )}

                <Select name="categoryId" label={t('transactions.form.category')} value={formData.categoryId} onChange={handleChange}>
                    <option value="">{t('transactions.form.selectCategory')}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{t(`categories.${cat.name.toLowerCase()}`, cat.name)}</option>)}
                </Select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}

                {(formData.transactionType === 'EXPENSE' || formData.transactionType === 'CREDIT_CARD') && (
                    <div>
                     <Select name="outAccountId" label={formData.transactionType === 'CREDIT_CARD' ? t('transactions.form.creditCardAccount') : t('transactions.form.outcomeAccount')} value={formData.outAccountId} onChange={handleChange}>
                        <option value="">{formData.transactionType === 'CREDIT_CARD' ? t('transactions.form.selectCreditCard') : t('transactions.form.selectOutcome')}</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                    {formErrors.outAccount && <p className="text-red-500 text-xs mt-1">{formErrors.outAccount}</p>}
                    </div>
                )}

                {formData.transactionType === 'INCOME' && (
                    <div>
                     <Select name="inAccountId" label={t('transactions.form.incomeAccount')} value={formData.inAccountId} onChange={handleChange}>
                        <option value="">{t('transactions.form.selectIncome')}</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                    {formErrors.inAccount && <p className="text-red-500 text-xs mt-1">{formErrors.inAccount}</p>}
                    </div>
                )}

                {formData.transactionType === 'TRANSFER' && (
                    <>
                        <div>
                        <Select name="outAccountId" label={t('transactions.form.outcomeAccount')} value={formData.outAccountId} onChange={handleChange}>
                            <option value="">{t('transactions.form.selectOutcome')}</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                        {formErrors.outAccount && <p className="text-red-500 text-xs mt-1">{formErrors.outAccount}</p>}
                        </div>
                        <div>
                        <Select name="inAccountId" label={t('transactions.form.incomeAccount')} value={formData.inAccountId} onChange={handleChange}>
                            <option value="">{t('transactions.form.selectIncome')}</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </Select>
                        {formErrors.inAccount && <p className="text-red-500 text-xs mt-1">{formErrors.inAccount}</p>}
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="primary">
                      {t('common.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default TransactionForm;
