import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PageTitle from '../components/ui/PageTitle';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { formatCurrency } from '../utils/dateUtils';
import { getLocalTransactions } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'];

const calculateLocalReport = (transactions, planning, categories, month, year) => {
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.creationDate);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};

  currentMonthTx.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.transactionType === 'INCOME') {
      totalIncome += amt;
    } else if (t.transactionType === 'EXPENSE' || (t.transactionType === 'TRANSFER' && (t.category || t.categoryId || t.categoryName))) {
      totalExpense += amt;
      const catName = t.category?.name || t.categoryName || 'Outros';
      categoryExpenses[catName] = (categoryExpenses[catName] || 0) + amt;
    }
  });

  const mappedPlanning = planning.map(p => {
    if (p.category && !p.category.name) {
      const cat = categories.find(c => String(c.id) === String(p.category.id));
      if (cat) {
        return { ...p, category: { ...p.category, name: cat.name } };
      }
    }
    return p;
  });

  const allCategoryNames = new Set([
    ...Object.keys(categoryExpenses),
    ...mappedPlanning
      .filter(p => p.month === month && p.year === year && p.category?.name)
      .map(p => p.category.name)
  ]);

  const categoryReports = Array.from(allCategoryNames).map(catName => {
    let sumPast = 0;
    let countPast = 0;

    for (let i = 1; i <= 3; i++) {
      let pastMonth = month - i;
      let pastYear = year;
      if (pastMonth <= 0) {
        pastMonth += 12;
        pastYear -= 1;
      }

      const pastTx = transactions.filter(t => {
        const d = new Date(t.creationDate);
        return d.getMonth() + 1 === pastMonth && d.getFullYear() === pastYear;
      });

      let spentPastMonth = 0;
      pastTx.forEach(t => {
        if ((t.category?.name === catName || t.categoryName === catName) &&
            (t.transactionType === 'EXPENSE' || t.transactionType === 'TRANSFER')) {
          spentPastMonth += parseFloat(t.amount) || 0;
        }
      });

      if (spentPastMonth > 0) {
        sumPast += spentPastMonth;
      }
      countPast++;
    }

    const avg = countPast > 0 ? parseFloat((sumPast / countPast).toFixed(2)) : 0;

    const matchedPlan = mappedPlanning.find(p => 
      p.month === month && 
      p.year === year && 
      (p.category?.name?.toLowerCase() === catName.toLowerCase() || p.categoryName?.toLowerCase() === catName.toLowerCase())
    );

    return {
      categoryName: catName,
      spentAmount: categoryExpenses[catName] || 0,
      plannedAmount: matchedPlan ? parseFloat(matchedPlan.estimatedAmount) || 0 : 0,
      averageSpentPastMonths: avg
    };
  });

  const monthlyTrends = [];
  for (let i = 5; i >= 0; i--) {
    let targetMonth = month - i;
    let targetYear = year;
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const mTx = transactions.filter(t => {
      const d = new Date(t.creationDate);
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    });

    let inc = 0;
    let exp = 0;
    mTx.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.transactionType === 'INCOME') {
        inc += amt;
      } else if (t.transactionType === 'EXPENSE' || (t.transactionType === 'TRANSFER' && (t.category || t.categoryId || t.categoryName))) {
        exp += amt;
      }
    });

    const monthName = `${String(targetMonth).padStart(2, '0')}/${targetYear}`;
    monthlyTrends.push({
      monthName,
      income: inc,
      expense: exp
    });
  }

  return {
    totalIncome,
    totalExpense,
    categoryReports,
    monthlyTrends
  };
};

function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { isLocalMode } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);

      if (isLocalMode) {
        const { getCachedPlanning, getCachedCategories } = await import('../services/db');
        const localTrans = await getLocalTransactions().catch(() => []);
        const localPlanning = await getCachedPlanning().catch(() => []);
        const localCategories = await getCachedCategories().catch(() => []);
        const report = calculateLocalReport(localTrans, localPlanning, localCategories, month, year);
        setData(report);
        setError(null);
        return;
      }

      const response = await api.get('/reports', {
        params: { month, year }
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('reports.noData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year, isLocalMode]);

  const netBalance = data ? data.totalIncome - data.totalExpense : 0;

  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
  const [budgets, setBudgets] = useState({});
  const [existingPlannings, setExistingPlannings] = useState({});
  const [planningModalLoading, setPlanningModalLoading] = useState(false);

  const handleOpenPlanningModal = async () => {
    try {
      setPlanningModalLoading(true);
      setIsPlanningModalOpen(true);
      setWizardStep(1);

      let cats = [];
      let monthPlannings = [];

      if (isLocalMode) {
        const { getCachedCategories, getCachedPlanning } = await import('../services/db');
        cats = await getCachedCategories().catch(() => []);
        const allPlannings = await getCachedPlanning().catch(() => []);
        monthPlannings = allPlannings.filter(p => p.month === month && p.year === year);
      } else {
        const categoriesResponse = await api.get('/categories');
        cats = categoriesResponse.data;

        const planningResponse = await api.get('/monthly-planning', {
          params: { month, year, size: 100 }
        });
        monthPlannings = planningResponse.data.content || planningResponse.data || [];
      }

      setAllCategories(cats);

      const selectedIds = new Set();
      const initialBudgets = {};
      const initialExistingPlannings = {};

      monthPlannings.forEach(p => {
        const catId = p.category?.id || p.categoryId;
        if (catId) {
          selectedIds.add(catId);
          initialBudgets[catId] = p.estimatedAmount || p.plannedValue || 0;
          initialExistingPlannings[catId] = p;
        }
      });

      setSelectedCategoryIds(selectedIds);
      setBudgets(initialBudgets);
      setExistingPlannings(initialExistingPlannings);
    } catch (err) {
      console.error(err);
    } finally {
      setPlanningModalLoading(false);
    }
  };

  const handleToggleCategorySelect = (categoryId) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
        if (budgets[categoryId] === undefined) {
          setBudgets(prevBudgets => ({ ...prevBudgets, [categoryId]: 0 }));
        }
      }
      return next;
    });
  };

  const handleToggleSelectAllCategories = () => {
    if (selectedCategoryIds.size === allCategories.length) {
      setSelectedCategoryIds(new Set());
    } else {
      const allIds = new Set(allCategories.map(c => c.id));
      setSelectedCategoryIds(allIds);
      allCategories.forEach(c => {
        if (budgets[c.id] === undefined) {
          setBudgets(prev => ({ ...prev, [c.id]: 0 }));
        }
      });
    }
  };

  const handleBudgetAmountChange = (categoryId, val) => {
    setBudgets(prev => ({
      ...prev,
      [categoryId]: val === '' ? '' : parseFloat(val)
    }));
  };

  const handleSavePlanning = async () => {
    try {
      setPlanningModalLoading(true);

      if (isLocalMode) {
        const { getCachedPlanning, cachePlanning } = await import('../services/db');
        let localPlannings = await getCachedPlanning().catch(() => []);

        localPlannings = localPlannings.filter(p => {
          const isThisMonth = p.month === month && p.year === year;
          if (!isThisMonth) return true;
          const catId = p.category?.id || p.categoryId;
          return selectedCategoryIds.has(catId) || selectedCategoryIds.has(Number(catId)) || selectedCategoryIds.has(String(catId));
        });

        for (const catId of selectedCategoryIds) {
          const amount = parseFloat(budgets[catId]) || 0;
          const existingIndex = localPlannings.findIndex(p =>
            p.month === month &&
            p.year === year &&
            String(p.category?.id || p.categoryId) === String(catId)
          );

          const categoryObj = allCategories.find(c => String(c.id) === String(catId));

          if (existingIndex >= 0) {
            localPlannings[existingIndex] = {
              ...localPlannings[existingIndex],
              estimatedAmount: amount,
              plannedValue: amount
            };
          } else {
            localPlannings.push({
              id: `local_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              month,
              year,
              category: categoryObj,
              estimatedAmount: amount,
              plannedValue: amount
            });
          }
        }

        await cachePlanning(localPlannings);
      } else {
        for (const catId in existingPlannings) {
          const numId = Number(catId);
          const strId = String(catId);
          if (!selectedCategoryIds.has(numId) && !selectedCategoryIds.has(strId)) {
            const entry = existingPlannings[catId];
            await api.delete(`/monthly-planning/${entry.id}`);
          }
        }

        for (const catId of selectedCategoryIds) {
          const amount = parseFloat(budgets[catId]) || 0;
          const entry = existingPlannings[catId];

          const categoryObj = allCategories.find(c => String(c.id) === String(catId));
          const payload = {
            month,
            year,
            category: categoryObj ? { id: categoryObj.id, name: categoryObj.name } : null,
            estimatedAmount: amount
          };

          if (entry) {
            await api.put(`/monthly-planning/${entry.id}`, payload);
          } else {
            await api.post('/monthly-planning', payload);
          }
        }
      }

      setIsPlanningModalOpen(false);
      fetchReport();
    } catch (err) {
      console.error(err);
    } finally {
      setPlanningModalLoading(false);
    }
  };

  const pieData = data?.categoryReports
    ? data.categoryReports
        .filter(item => item.spentAmount > 0)
        .map(item => ({
          name: item.categoryName ? t(`categories.${item.categoryName.toLowerCase()}`, item.categoryName) : t('common.all'),
          value: parseFloat(item.spentAmount)
        }))
    : [];

  const barData = data?.monthlyTrends
    ? data.monthlyTrends.map(item => {
        const [mStr, yStr] = item.monthName.split('/');
        return {
          name: item.monthName,
          month: parseInt(mStr, 10),
          year: parseInt(yStr, 10),
          [t('common.income')]: parseFloat(item.income),
          [t('common.expenses')]: parseFloat(item.expense)
        };
      })
    : [];

  const handleChartClick = (state) => {
    let m = null;
    let y = null;

    if (state) {
      if (state.activePayload && state.activePayload.length > 0) {
        const clickedData = state.activePayload[0].payload;
        if (clickedData && clickedData.month && clickedData.year) {
          m = clickedData.month;
          y = clickedData.year;
        }
      } else if (state.payload) {
        m = state.payload.month;
        y = state.payload.year;
      } else if (state.month && state.year) {
        m = state.month;
        y = state.year;
      } else if (state.activeLabel) {
        const [mStr, yStr] = state.activeLabel.split('/');
        m = parseInt(mStr, 10);
        y = parseInt(yStr, 10);
      }
    }

    if (m && y && !isNaN(m) && !isNaN(y)) {
      setMonth(m);
      setYear(y);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <PageTitle>{t('reports.title')}</PageTitle>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-32 bg-brand-dark/50 border-brand-border/30 text-white"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {t(`months.${i + 1}`)}
              </option>
            ))}
          </Select>
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-32 bg-brand-dark/50 border-brand-border/30 text-white"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">
          {t('common.loading')}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-500 mb-1">
                {t('reports.totalIncome')}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatCurrency(data.totalIncome)}
              </h3>
            </div>
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-1">
                {t('reports.totalExpense')}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatCurrency(data.totalExpense)}
              </h3>
            </div>
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <p className={`text-sm font-semibold uppercase tracking-wider mb-1 ${netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                {t('reports.netBalance')}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatCurrency(netBalance)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <h4 className="text-lg font-bold text-white mb-4">
                {t('reports.distribution')}
              </h4>
              <div className="min-h-80 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
                    <div className="w-full md:w-1/2 h-64 flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2 max-h-64 overflow-y-auto pr-2">
                      {pieData.map((entry, index) => {
                        const percentage = ((entry.value / data.totalExpense) * 100).toFixed(1);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-dark/20 transition-colors">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></span>
                              <span className="text-sm font-medium text-gray-200">{entry.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-white font-mono">{formatCurrency(entry.value)}</span>
                              <span className="text-xs text-text-secondary ml-2 font-mono">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary">{t('dashboard.noChartData')}</p>
                )}
              </div>
            </div>

            <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
              <h4 className="text-lg font-bold text-white mb-4">
                {t('reports.trends')}
              </h4>
              <div className="h-80">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      onClick={handleChartClick}
                      style={{ cursor: 'pointer' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey={t('common.income')} fill="#10b981" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} onClick={handleChartClick} />
                      <Bar dataKey={t('common.expenses')} fill="#ef4444" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} onClick={handleChartClick} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-text-secondary">{t('dashboard.noChartData')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 p-6 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-white">
                {t('reports.budgetProgress')}
              </h4>
              <Button
                onClick={handleOpenPlanningModal}
                className="bg-brand-primary/20 hover:bg-brand-primary/30 text-white border border-brand-primary/40 shadow-[0_0_15px_rgba(138,109,255,0.2)] px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                {t('planning.title')}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto pr-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#1a1529] z-10">
                  <tr className="border-b border-brand-border/20 text-text-secondary text-sm font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">{t('reports.category')}</th>
                    <th className="py-3 px-4 text-right">{t('reports.spent')}</th>
                    <th className="py-3 px-4 text-right">{t('reports.budget')}</th>
                    <th className="py-3 px-4 text-right">{t('reports.average')}</th>
                    <th className="py-3 px-4">{t('reports.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10 text-white">
                  {data.categoryReports && data.categoryReports.length > 0 ? (
                    data.categoryReports.map((report, index) => {
                      const limit = parseFloat(report.plannedAmount);
                      const spent = parseFloat(report.spentAmount);
                      const avg = parseFloat(report.averageSpentPastMonths);
                      const hasBudget = limit > 0;
                      const ratio = hasBudget ? (spent / limit) * 100 : 0;
                      const exceeded = hasBudget && spent > limit;
                      const isInvestment = report.categoryName?.toLowerCase() === 'investimentos';

                      // Determine colors and status message
                      let spentColor = isInvestment ? 'text-brand-success' : 'text-red-400';
                      let barColorClass = 'bg-green-500';
                      let textColorClass = 'text-green-500';
                      let statusText = `${t('reports.withinLimit')} (${ratio.toFixed(0)}%)`;

                      if (isInvestment) {
                        if (exceeded) {
                          barColorClass = 'bg-brand-success';
                          textColorClass = 'text-brand-success';
                          statusText = `${t('reports.investmentExceeded')} (${(ratio - 100).toFixed(0)}%+)`;
                        } else {
                          barColorClass = 'bg-green-500';
                          textColorClass = 'text-green-500';
                          statusText = `${t('reports.withinLimit')} (${ratio.toFixed(0)}%)`;
                        }
                      } else {
                        if (exceeded) {
                          barColorClass = 'bg-brand-danger';
                          textColorClass = 'text-brand-danger';
                          statusText = `${t('reports.exceeded')} (${(ratio - 100).toFixed(0)}%+)`;
                        } else if (ratio >= 70) {
                          barColorClass = 'bg-brand-warning';
                          textColorClass = 'text-brand-warning';
                          statusText = `${t('reports.warningLimit')} (${ratio.toFixed(0)}%)`;
                        } else {
                          barColorClass = 'bg-green-500';
                          textColorClass = 'text-green-500';
                          statusText = `${t('reports.withinLimit')} (${ratio.toFixed(0)}%)`;
                        }
                      }

                      return (
                        <tr key={index} className="hover:bg-brand-card-hover/20 transition-colors">
                          <td className="py-4 px-4 font-medium">{report.categoryName ? t(`categories.${report.categoryName.toLowerCase()}`, report.categoryName) : t('common.all')}</td>
                          <td className={`py-4 px-4 text-right font-semibold ${spentColor}`}>
                            {formatCurrency(spent)}
                          </td>
                          <td className="py-4 px-4 text-right text-text-secondary">
                            {hasBudget ? formatCurrency(limit) : '-'}
                          </td>
                          <td className="py-4 px-4 text-right text-text-secondary">
                            {formatCurrency(avg)}
                          </td>
                          <td className="py-4 px-4">
                            {hasBudget ? (
                              <div className="flex flex-col gap-1.5 w-56">
                                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                                    style={{ width: `${Math.min(ratio, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-sm font-semibold ${textColorClass}`}>
                                  {statusText}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-secondary italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-text-secondary">
                        {t('reports.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <Modal isOpen={isPlanningModalOpen} onCancel={() => setIsPlanningModalOpen(false)} maxWidth="max-w-2xl">
        {planningModalLoading && allCategories.length === 0 ? (
          <div className="flex justify-center py-12">
            <span className="text-white text-sm">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h4 className="text-lg font-bold text-white">
                {wizardStep === 1
                  ? `${t('planning.title')} - ${t('planning.form.category')}`
                  : `${t('planning.title')} - ${t('planning.form.amount')}`}
              </h4>
              <span className="text-xs text-text-secondary mt-1 block">
                Ref: {t(`months.${month}`)} / {year}
              </span>
            </div>

            {wizardStep === 1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllCategories}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      allCategories.length > 0 && selectedCategoryIds.size === allCategories.length
                        ? 'bg-brand-primary/25 text-white border border-brand-primary/50'
                        : 'bg-brand-dark/30 text-text-secondary border border-brand-border/20 hover:bg-brand-dark/50'
                    }`}
                  >
                    {t('planning.selectAll')}
                  </button>
                  <span className="text-xs text-text-secondary">
                    {selectedCategoryIds.size} {t('planning.itemsSelected')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {allCategories.length > 0 ? (
                    allCategories.map(cat => {
                      const isSelected = selectedCategoryIds.has(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleToggleCategorySelect(cat.id)}
                          className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-primary/20 text-white border border-brand-primary/40'
                              : 'bg-brand-dark/20 text-text-secondary border border-brand-border/10 hover:bg-brand-dark/40 hover:text-white'
                          }`}
                        >
                          {t(`categories.${cat.name.toLowerCase()}`, cat.name)}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-text-secondary text-center py-6 col-span-2">{t('categories.noCategories')}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsPlanningModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={selectedCategoryIds.size === 0}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {allCategories
                    .filter(cat => selectedCategoryIds.has(cat.id))
                    .map(cat => (
                      <div key={cat.id} className="flex items-center gap-4 bg-brand-dark/20 border border-brand-border/10 rounded-xl px-4 py-3">
                        <span className="text-sm font-semibold text-white flex-1 truncate">
                          {t(`categories.${cat.name.toLowerCase()}`, cat.name)}
                        </span>
                        <div className="relative w-44 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                            {i18n.language.startsWith('pt') ? 'R$' : '$'}
                          </span>
                          <input
                            id={`budget-input-${cat.id}`}
                            type="number"
                            step="0.01"
                            value={budgets[cat.id] !== undefined ? budgets[cat.id] : ''}
                            onChange={(e) => handleBudgetAmountChange(cat.id, e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-brand-dark/40 border border-brand-border/20 text-white text-sm focus:outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/30 transition-all placeholder:text-text-secondary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setWizardStep(1)}>
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleSavePlanning}
                    disabled={planningModalLoading}
                  >
                    {planningModalLoading ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ReportsPage;
