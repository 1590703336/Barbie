import { useState, useEffect } from 'react';
import { getExchangeRates } from '../services/currencyService';

const CurrencyRates = () => {
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await getExchangeRates();
                // Backend returns { success: true, data: { rate1: v1, ... } } based on controller structure
                // Let's verify controller response: res.status(200).json({ success: true, data: rates });
                if (response.success) {
                    setRates(response.data);
                } else {
                    // if structure is different
                    setRates(response.data || response);
                }
            } catch (err) {
                setError('Failed to load exchange rates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading rates...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-slate-800">Current Exchange Rates (Base: USD)</h1>
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
