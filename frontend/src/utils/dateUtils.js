import { format } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import i18n from '../i18n';

export const formatDate = (date, pattern) => {
    if (!date) return '';
    
    const locale = i18n.language.startsWith('pt') ? ptBR : enUS;
    const defaultPattern = i18n.language.startsWith('pt') ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
    const finalPattern = pattern || defaultPattern;
    
    // If it's a string in YYYY-MM-DD format (typical from backend for local dates)
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.split('T')[0])) {
        const [year, month, day] = date.split('T')[0].split('-').map(Number);
        return format(new Date(year, month - 1, day), finalPattern, { locale });
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
