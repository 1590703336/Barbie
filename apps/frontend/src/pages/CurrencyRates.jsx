import { useState, useEffect, useMemo } from 'react';
import {
    getExchangeRates,
    getAvailableCurrencies,
    getConvertPairs,
    createConvertPair,
    updateConvertPair,
    deleteConvertPair
} from '../services/currencyService';

const CurrencyRates = () => {
    const [rates, setRates] = useState({});
    const [currencies, setCurrencies] = useState([]);
    const [convertPairs, setConvertPairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cacheTime, setCacheTime] = useState(null);
    const [nextUpdateTime, setNextUpdateTime] = useState(null);

    // State for amounts in each pair (keyed by pair id)
    const [amounts, setAmounts] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ratesResponse, currencyList, pairsResponse] = await Promise.all([
                    getExchangeRates(),
                    getAvailableCurrencies(),
                    getConvertPairs().catch(() => ({ data: [] })) // Graceful fallback if not logged in
                ]);

                if (ratesResponse.success) {
                    setRates(ratesResponse.data);
                    // Use cache time from backend
                    if (ratesResponse.cacheTime) {
                        setCacheTime(new Date(ratesResponse.cacheTime));
                        setNextUpdateTime(new Date(ratesResponse.nextUpdateTime));
                    }
                } else {
                    setRates(ratesResponse.data || ratesResponse);
                }

                setCurrencies(currencyList);
                setConvertPairs(pairsResponse.data || []);
            } catch (err) {
                setError('Failed to load exchange rates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Get amount for a pair (default 100)
    const getAmount = (pairId) => {
        return amounts[pairId] !== undefined ? amounts[pairId] : 100;
    };

    // Convert amount from one currency to another
    const convertAmount = (amount, fromCurrency, toCurrency) => {
        if (!amount || isNaN(amount) || !rates[fromCurrency] || !rates[toCurrency]) {
            return '';
        }
        // Convert: amount in fromCurrency -> USD -> toCurrency
        const amountInUSD = amount / rates[fromCurrency];
        const result = amountInUSD * rates[toCurrency];
        return result.toFixed(2);
    };

    // Add new convert pair
    const handleAddPair = async () => {
        try {
            const response = await createConvertPair({
                fromCurrency: 'USD',
                toCurrency: 'EUR'
            });
            setConvertPairs([response.data, ...convertPairs]);
        } catch (err) {
            console.error('Failed to create convert pair:', err);
            setError('Failed to create convert pair. Please log in first.');
        }
    };

    // Update pair currencies
    const handleUpdatePair = async (id, updates) => {
        try {
            const response = await updateConvertPair(id, updates);
            setConvertPairs(convertPairs.map(p => p._id === id ? response.data : p));
        } catch (err) {
            console.error('Failed to update convert pair:', err);
        }
    };

    // Swap currencies in a pair
    const handleSwapPair = async (pair) => {
        try {
            const response = await updateConvertPair(pair._id, {
                fromCurrency: pair.toCurrency,
                toCurrency: pair.fromCurrency
            });
            setConvertPairs(convertPairs.map(p => p._id === pair._id ? response.data : p));
        } catch (err) {
            console.error('Failed to swap currencies:', err);
        }
    };

    // Delete pair
    const handleDeletePair = async (id) => {
        try {
            await deleteConvertPair(id);
            setConvertPairs(convertPairs.filter(p => p._id !== id));
            // Clean up amount state
            const newAmounts = { ...amounts };
            delete newAmounts[id];
            setAmounts(newAmounts);
        } catch (err) {
            console.error('Failed to delete convert pair:', err);
        }
    };

    // Handle amount change
    const handleAmountChange = (pairId, value) => {
        setAmounts({ ...amounts, [pairId]: value });
    };

    if (loading) return <div className="text-center mt-10">Loading rates...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Currency Converter Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Currency Converter</h2>
                    <button
                        onClick={handleAddPair}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium"
                    >
                        + Add Pair
                    </button>
                </div>

                {convertPairs.length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
                        No convert pairs yet. Click "Add Pair" to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {convertPairs.map((pair) => (
                            <div
                                key={pair._id}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Amount input */}
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={getAmount(pair._id)}
                                        onChange={(e) => handleAmountChange(pair._id, e.target.value)}
                                        className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    />

                                    {/* From currency select */}
                                    <select
                                        value={pair.fromCurrency}
                                        onChange={(e) => handleUpdatePair(pair._id, { fromCurrency: e.target.value })}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    >
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    {/* Swap button */}
                                    <button
                                        onClick={() => handleSwapPair(pair)}
                                        className="px-2 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition text-lg"
                                        title="Swap currencies"
                                    >
                                        ⇄
                                    </button>

                                    <span className="text-slate-400">=</span>

                                    {/* Converted result */}
                                    <div className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
                                        {convertAmount(getAmount(pair._id), pair.fromCurrency, pair.toCurrency) || '—'}
                                    </div>

                                    {/* To currency select */}
                                    <select
                                        value={pair.toCurrency}
                                        onChange={(e) => handleUpdatePair(pair._id, { toCurrency: e.target.value })}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    >
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDeletePair(pair._id)}
                                        className="ml-auto px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Exchange Rates Table */}
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Current Exchange Rates (Base: USD)</h1>
            {cacheTime && nextUpdateTime && (
                <div className="mb-4 text-sm text-slate-500">
                    <p>Last updated: {cacheTime.toLocaleString()}</p>
                    <p>Next update: {nextUpdateTime.toLocaleString()}</p>
                </div>
            )}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 font-medium bg-slate-100 border-b">
                    <div>Currency</div>
                    <div>Rate</div>
                    <div>Currency</div>
                    <div>Rate</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    {Object.entries(rates).map(([currency, rate]) => (
                        <div key={currency} className="contents">
                            <div className="text-slate-600 border-b pb-2">{currency}</div>
                            <div className="font-semibold text-slate-800 border-b pb-2">{rate}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CurrencyRates;
