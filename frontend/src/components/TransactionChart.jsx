import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TransactionChart = ({ transactions }) => {
    const [timeRange, setTimeRange] = React.useState('1M'); // Default to 1 Month

    const chartData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const now = new Date();
        let startDate = new Date();

        // Filter transactions based on time range
        switch (timeRange) {
            case '1S': // 1 Week
                startDate.setDate(now.getDate() - 7);
                break;
            case '1M': // 1 Month
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '1A': // 1 Year
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'Max':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        const filteredTransactions = transactions.filter(t => {
            // Parse YYYY-MM-DD as local time
            let tDate;
            if (typeof t.creationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.creationDate)) {
                 const [year, month, day] = t.creationDate.split('-').map(Number);
                 tDate = new Date(year, month - 1, day);
            } else {
                 tDate = new Date(t.creationDate);
            }
            return tDate >= startDate && tDate <= now;
        });

        // 1. Group transactions by date
        const groupedByDate = filteredTransactions.reduce((acc, t) => {
            let localDate;
            if (typeof t.creationDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.creationDate)) {
                 const [year, month, day] = t.creationDate.split('-').map(Number);
                 localDate = new Date(year, month - 1, day);
            } else {
                 localDate = new Date(t.creationDate);
            }
            
            const date = localDate.toLocaleDateString('en-US');
            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0, transfer: 0, rawDate: localDate };
            }
            if (t.transactionType === 'INCOME') {
                acc[date].income += t.amount;
            } else if (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_CARD') {
                acc[date].expense += t.amount;
            } else if (t.transactionType === 'TRANSFER') {
                acc[date].transfer += t.amount;
            }
            return acc;
        }, {});

        // 2. Sort by date
        const sortedDates = Object.values(groupedByDate).sort((a, b) => a.rawDate - b.rawDate);

        // 3. Calculate cumulative balance
        let cumulativeIncome = 0;
        let cumulativeExpense = 0;
        let cumulativeTransfer = 0;

        return sortedDates.map(item => {
            cumulativeIncome += item.income;
            cumulativeExpense += item.expense;
            cumulativeTransfer += item.transfer;
            
            return {
                ...item,
                income: cumulativeIncome,
                expense: cumulativeExpense,
                transfer: cumulativeTransfer
            };
        });
    }, [transactions, timeRange]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-brand-card border border-brand-border/50 p-3 rounded-lg shadow-xl">
                    <p className="text-gray-300 font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-400 capitalize">{entry.name}:</span>
                            <span className="text-white font-mono">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-end gap-2 mb-4">
                {['1S', '1M', '1A', 'Max'].map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                            timeRange === range
                                ? 'bg-brand-primary text-white'
                                : 'bg-brand-card border border-brand-border/50 text-gray-400 hover:text-white hover:border-brand-primary/50'
                        }`}
                    >
                        {range === '1S' ? '1 Week' : range === '1M' ? '1 Month' : range === '1A' ? '1 Year' : 'Max'}
                    </button>
                ))}
            </div>
            
            <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={true} horizontal={true} stroke="#374151" strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            hide={true} 
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="rect"
                            iconSize={20}
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-gray-400 text-sm ml-1">{value}</span>}
                        />
                        
                        {/* Income - Green/Teal */}
                        <Line 
                            name="Income"
                            type="linear" 
                            dataKey="income" 
                            stroke="#10B981" 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#10B981', stroke: '#fff' }}
                        />

                        {/* Transfers - Purple */}
                        <Line 
                            name="Transfers"
                            type="linear" 
                            dataKey="transfer" 
                            stroke="#8B5CF6" 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#fff' }}
                        />

                        {/* Expenses - Red */}
                        <Line 
                            name="Expenses"
                            type="linear" 
                            dataKey="expense" 
                            stroke="#EF4444" 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TransactionChart;
