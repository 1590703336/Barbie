import React, { useState } from 'react';
import CurrencySelect from '../components/common/CurrencySelect';
import {
    useExchangeRates,
    useAvailableCurrencies,
    useConvertPairs,
    useCreateConvertPair,
    useUpdateConvertPair,
    useDeleteConvertPair
} from '../hooks/queries/useCurrencyQueries';

const CurrencyRates = () => {
    const [error, setError] = useState(null);

    // State for amounts in each pair (keyed by pair id)
    const [amounts, setAmounts] = useState({});

    // React Query hooks for data fetching
    const { data: ratesResponse, isLoading: ratesLoading } = useExchangeRates();
    const { data: currencies = [], isLoading: currenciesLoading } = useAvailableCurrencies();
    const { data: pairsResponse, isLoading: pairsLoading } = useConvertPairs();

    // Mutation hooks
    const createPairMutation = useCreateConvertPair();
    const updatePairMutation = useUpdateConvertPair();
    const deletePairMutation = useDeleteConvertPair();

    const rates = ratesResponse?.data || {};
    const convertPairs = pairsResponse?.data || [];
    const cacheTime = ratesResponse?.cacheTime ? new Date(ratesResponse.cacheTime) : null;
    const nextUpdateTime = ratesResponse?.nextUpdateTime ? new Date(ratesResponse.nextUpdateTime) : null;

    const loading = ratesLoading || currenciesLoading || pairsLoading;

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
            await createPairMutation.mutateAsync({
                fromCurrency: 'USD',
                toCurrency: 'EUR'
            });
        } catch (err) {
            console.error('Failed to create convert pair:', err);
            setError('Failed to create convert pair. Please log in first.');
        }
    };

    // Update pair currencies
    const handleUpdatePair = async (id, updates) => {
        try {
            await updatePairMutation.mutateAsync({ id, data: updates });
        } catch (err) {
            console.error('Failed to update convert pair:', err);
        }
    };

    // Swap currencies in a pair
    const handleSwapPair = async (pair) => {
        try {
            await updatePairMutation.mutateAsync({
                id: pair._id,
                data: {
                    fromCurrency: pair.toCurrency,
                    toCurrency: pair.fromCurrency
                }
            });
        } catch (err) {
            console.error('Failed to swap currencies:', err);
        }
    };

    // Delete pair
    const handleDeletePair = async (id) => {
        try {
            await deletePairMutation.mutateAsync(id);
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
                    <h2 className="text-2xl font-bold text-main">Currency Converter</h2>
                    <button
                        onClick={handleAddPair}
                        disabled={createPairMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition text-sm font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                        {createPairMutation.isPending ? 'Adding...' : '+ Add Pair'}
                    </button>
                </div>

                {convertPairs.length === 0 ? (
                    <div className="glass-panel rounded-lg p-6 text-center text-secondary">
                        No convert pairs yet. Click "Add Pair" to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {convertPairs.map((pair) => (
                            <div
                                key={pair._id}
                                className="glass-card rounded-xl p-4"
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Amount input */}
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={getAmount(pair._id)}
                                        onChange={(e) => handleAmountChange(pair._id, e.target.value)}
                                        className="w-28 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-main focus:outline-none focus:border-indigo-500"
                                    />

                                    {/* From currency select */}
                                    <CurrencySelect
                                        value={pair.fromCurrency}
                                        onChange={(val) => handleUpdatePair(pair._id, { fromCurrency: val })}
                                        currencies={currencies}
                                        className="w-32 sm:w-48"
                                        placeholder="From"
                                    />

                                    {/* Swap button */}
                                    <button
                                        onClick={() => handleSwapPair(pair)}
                                        disabled={updatePairMutation.isPending}
                                        className="px-2 py-2 text-secondary hover:text-main hover:bg-white/10 rounded-lg transition text-lg disabled:opacity-50"
                                        title="Swap currencies"
                                    >
                                        ⇄
                                    </button>

                                    <span className="text-secondary">=</span>

                                    {/* Converted result */}
                                    <div className="w-28 px-3 py-2 glass-panel rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {convertAmount(getAmount(pair._id), pair.fromCurrency, pair.toCurrency) || '—'}
                                    </div>

                                    {/* To currency select */}
                                    <CurrencySelect
                                        value={pair.toCurrency}
                                        onChange={(val) => handleUpdatePair(pair._id, { toCurrency: val })}
                                        currencies={currencies}
                                        className="w-32 sm:w-48"
                                        placeholder="To"
                                    />

                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDeletePair(pair._id)}
                                        disabled={deletePairMutation.isPending}
                                        className="ml-auto px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition text-sm disabled:opacity-50"
                                    >
                                        {deletePairMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Exchange Rates Table */}
            <h1 className="text-3xl font-bold mb-2 text-main">Current Exchange Rates (Base: USD)</h1>
            {cacheTime && nextUpdateTime && (
                <div className="mb-4 text-sm text-secondary">
                    <p>Last updated: {cacheTime.toLocaleString()}</p>
                    <p>Next update: {nextUpdateTime.toLocaleString()}</p>
                </div>
            )}
            <div className="glass-card rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 font-medium bg-white/5 border-b border-white/10 text-muted">
                    <div>Currency</div>
                    <div>Rate</div>
                    <div>Currency</div>
                    <div>Rate</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    {Object.entries(rates).map(([currency, rate]) => (
                        <div key={currency} className="contents">
                            <div className="text-secondary border-b border-white/5 pb-2">{currency}</div>
                            <div className="font-semibold text-main border-b border-white/5 pb-2">{rate}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CurrencyRates;
