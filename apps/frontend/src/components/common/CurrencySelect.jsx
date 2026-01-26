import { Fragment, useState, useMemo } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { CURRENCY_NAMES, TOP_CURRENCIES } from '../../data/currencyNames'

export default function CurrencySelect({
    value,
    onChange,
    currencies = [],
    label,
    disabled = false,
    className = '',
    placeholder = 'Select currency...'
}) {
    const [query, setQuery] = useState('')

    const filteredCurrencies = useMemo(() => {
        if (query === '') {
            // Prioritize top currencies + then the rest
            const tops = currencies.filter(c => TOP_CURRENCIES.includes(c)).sort();
            const others = currencies.filter(c => !TOP_CURRENCIES.includes(c)).sort();
            return [...tops, ...others];
        }

        const lowerQuery = query.toLowerCase()

        return currencies.filter((currency) => {
            const code = currency.toLowerCase()
            const name = (CURRENCY_NAMES[currency] || '').toLowerCase()
            return code.includes(lowerQuery) || name.includes(lowerQuery)
        }).sort((a, b) => {
            // Exact match first
            if (a.toLowerCase() === lowerQuery) return -1;
            if (b.toLowerCase() === lowerQuery) return 1;

            // Starts with match next
            const aStarts = a.toLowerCase().startsWith(lowerQuery);
            const bStarts = b.toLowerCase().startsWith(lowerQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // Prioritize top currencies in search too
            const aIsTop = TOP_CURRENCIES.includes(a);
            const bIsTop = TOP_CURRENCIES.includes(b);
            if (aIsTop && !bIsTop) return -1;
            if (!aIsTop && bIsTop) return 1;

            return 0;
        })
    }, [query, currencies])

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-muted mb-1">{label}</label>}
            <Combobox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-slate-800/50 text-left border border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:text-sm transition-all duration-200">
                        <Combobox.Input
                            className="w-full !border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-main !bg-transparent focus:ring-0 placeholder-slate-500"
                            displayValue={(currency) => currency ? `${currency} - ${CURRENCY_NAMES[currency] || currency}` : ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {filteredCurrencies.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3 text-secondary italic">
                                    No currency found.
                                </div>
                            ) : (
                                filteredCurrencies.map((currency) => (
                                    <Combobox.Option
                                        key={currency}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors duration-150 ${active ? 'bg-indigo-600/20 text-indigo-300' : 'text-main'
                                            }`
                                        }
                                        value={currency}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${selected ? 'font-medium text-emerald-400' : 'font-normal'
                                                        }`}
                                                >
                                                    <span className="inline-block w-10">{currency}</span>
                                                    <span className={`ml-2 truncate text-xs ${active ? 'text-indigo-300' : 'text-slate-500'}`}>
                                                        {CURRENCY_NAMES[currency]}
                                                    </span>
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-indigo-300' : 'text-emerald-500'
                                                            }`}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    )
}
