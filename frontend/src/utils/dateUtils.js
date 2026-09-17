import { format } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import i18n from '../i18n';

export const formatDate = (date, pattern) => {
    if (!date) return '';
    
    const locale = i18n.language.startsWith('pt') ? ptBR : enUS;
    const defaultPattern = i18n.language.startsWith('pt') ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
    const finalPattern = pattern || defaultPattern;
    
    if (typeof date === 'string') {
        const dateStr = date.split('T')[0];
        if (dateStr.length === 10 && dateStr[4] === '-' && dateStr[7] === '-') {
            const [yearStr, monthStr, dayStr] = dateStr.split('-');
            const year = Number(yearStr);
            const month = Number(monthStr);
            const day = Number(dayStr);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                return format(new Date(year, month - 1, day), finalPattern, { locale });
            }
        }
    }

    return format(new Date(date), finalPattern, { locale });
};

export const formatCurrency = (value) => {
    const locale = i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';
    const currency = i18n.language.startsWith('pt') ? 'BRL' : 'USD';
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(value || 0);
};
