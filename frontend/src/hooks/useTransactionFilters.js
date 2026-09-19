import { useState, useCallback, useEffect } from 'react';

export const useTransactionFilters = (initialFilters = {}) => {
    const [filters, setFilters] = useState({
        name: initialFilters.name || '',
        startDate: initialFilters.startDate || '',
        endDate: initialFilters.endDate || '',
        categoryId: initialFilters.categoryId || '',
        transactionType: initialFilters.transactionType || ''
    });

    useEffect(() => {
        setFilters({
            name: initialFilters.name || '',
            startDate: initialFilters.startDate || '',
            endDate: initialFilters.endDate || '',
            categoryId: initialFilters.categoryId || '',
            transactionType: initialFilters.transactionType || ''
        });
    }, [initialFilters.name, initialFilters.startDate, initialFilters.endDate, initialFilters.categoryId, initialFilters.transactionType]);

    const handleChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            name: '',
            startDate: '',
            endDate: '',
            categoryId: '',
            transactionType: ''
        });
    }, []);

    const getFilterParams = useCallback(() => {
        const params = {};
        if (filters.name) params.name = filters.name;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.transactionType) params.transactionType = filters.transactionType;
        return params;
    }, [filters]);

    return {
        filters,
        handleChange,
        clearFilters,
        getFilterParams
    };
};
