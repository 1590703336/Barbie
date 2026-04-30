import { useEffect, useState } from 'react'
import { getBinding, bindBot, unbindBot } from '../../services/telegramBotService'

const COMMAND_LIST = [
    { cmd: '/login <email> <password>', desc: 'Link this chat to your Barbie account.' },
    { cmd: '/add', desc: 'Send the next text/photo and AI parses it as expense or subscription.' },
    { cmd: '/check', desc: 'Generate an AI report from your recent expenses, subscriptions, and budgets.' },
    { cmd: '/unbind', desc: 'Disconnect this chat from your Barbie account.' },
]

function TelegramBotCard() {
    const [binding, setBinding] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [token, setToken] = useState('')
    const [message, setMessage] = useState({ type: '', text: '' })

    const refresh = async () => {
        try {
            setLoading(true)
            const data = await getBinding()
            setBinding(data?.binding ?? null)
        } catch (err) {
            console.error('telegram bot fetch failed', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const handleBind = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage({ type: '', text: '' })
        try {
            const data = await bindBot(token.trim())
            setBinding(data?.binding ?? null)
            setToken('')
            setMessage({ type: 'success', text: `Bot @${data?.binding?.botUsername} bound and started.` })
        } catch (err) {
            const text = err?.response?.data?.message ?? err?.message ?? 'Failed to bind bot'
            setMessage({ type: 'error', text })
        } finally {
            setSubmitting(false)
        }
    }

    const handleUnbind = async () => {
        if (!window.confirm('Unbind your Telegram bot? Existing chats will stop receiving updates.')) {
            return
        }
        setSubmitting(true)
        setMessage({ type: '', text: '' })
        try {
            await unbindBot()
            setBinding(null)
            setMessage({ type: 'success', text: 'Bot unbound.' })
        } catch (err) {
            const text = err?.response?.data?.message ?? err?.message ?? 'Failed to unbind bot'
            setMessage({ type: 'error', text })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mt-6 rounded-2xl glass-card p-6 shadow-xl">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-main">Telegram Bot</h3>
                <p className="text-sm text-secondary">
                    Bind your own Telegram bot to add expenses or subscriptions from chat, including from
                    photos of receipts. Talk to{' '}
                    <span className="font-mono">@BotFather</span> on Telegram to create a bot and copy its
                    token here.
                </p>
            </div>

            {message.text && (
                <div
                    className={`mb-4 rounded-lg p-3 text-sm ${
                        message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-secondary">Loading…</p>
            ) : binding ? (
                <div className="space-y-4">
                    <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-muted">Bound bot</div>
                                <div className="font-mono text-main">@{binding.botUsername}</div>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    binding.ownedByThisInstance
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                }`}
                                title={`runningOn=${binding.runningOn ?? 'none'}`}
                            >
                                {binding.ownedByThisInstance
                                    ? 'Running on this instance'
                                    : `Running on ${binding.runningOn ?? 'unknown'}`}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-secondary">
                            Linked chats: {binding.chatBindingsCount ?? 0}
                        </div>
                    </div>

                    <details className="rounded-lg bg-slate-800/30 border border-slate-700/60 p-3 text-sm text-secondary">
                        <summary className="cursor-pointer font-medium text-main">
                            Available commands
                        </summary>
                        <ul className="mt-2 space-y-1">
                            {COMMAND_LIST.map(({ cmd, desc }) => (
                                <li key={cmd}>
                                    <code className="text-indigo-300">{cmd}</code> — {desc}
                                </li>
                            ))}
                        </ul>
                    </details>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleUnbind}
                            disabled={submitting}
                            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                        >
                            {submitting ? 'Working…' : 'Unbind bot'}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleBind} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted">Bot token</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            required
                            autoComplete="off"
                            spellCheck={false}
                            className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm font-mono text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            The token will be encrypted at rest. Only the deployment that handles this
                            request will run the bot — bind from the Barbie deployment you want it to live
                            on.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !token.trim()}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                        >
                            {submitting ? 'Binding…' : 'Bind bot'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default TelegramBotCard
