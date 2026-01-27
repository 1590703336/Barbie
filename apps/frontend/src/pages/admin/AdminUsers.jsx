import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion as Motion } from 'framer-motion'
import {
    getAllUsers,
    getUserDetails,
    updateUserRole,
    deleteUser,
} from '../../services/adminService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatCurrency'

// Query keys
const userKeys = {
    all: ['admin', 'users'],
    list: (params) => ['admin', 'users', 'list', params],
    detail: (id) => ['admin', 'users', 'detail', id],
}

// Tab labels
const TABS = ['Overview', 'Expenses', 'Incomes', 'Subscriptions', 'Budgets']

/**
 * UserDetailContent - Tabbed modal content for user details
 */
function UserDetailContent({ user, activity, onClose, onRoleChange, roleLoading }) {
    const [activeTab, setActiveTab] = useState('Overview')

    if (!user) return null

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-semibold text-main">{user.name}</h3>
                    <p className="text-sm text-muted">{user.email}</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full mt-1 ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'
                        }`}>
                        {user.role}
                    </span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-slate-700">
                    <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-slate-700 flex-shrink-0 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-secondary hover:text-main'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {activeTab === 'Overview' && (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-secondary">Expenses</p>
                                <p className="text-lg font-semibold text-rose-400">{activity?.counts?.expenses ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-secondary">Incomes</p>
                                <p className="text-lg font-semibold text-emerald-400">{activity?.counts?.incomes ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-secondary">Subscriptions</p>
                                <p className="text-lg font-semibold text-blue-400">{activity?.counts?.subscriptions ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-secondary">Budgets</p>
                                <p className="text-lg font-semibold text-amber-400">{activity?.counts?.budgets ?? 0}</p>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-lg bg-rose-500/10">
                                <p className="text-sm text-secondary">Total Expenses (USD)</p>
                                <p className="text-xl font-bold text-rose-400">
                                    {formatCurrency(activity?.totals?.expenseUSD ?? 0, 'USD')}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-emerald-500/10">
                                <p className="text-sm text-secondary">Total Income (USD)</p>
                                <p className="text-xl font-bold text-emerald-400">
                                    {formatCurrency(activity?.totals?.incomeUSD ?? 0, 'USD')}
                                </p>
                            </div>
                        </div>

                        {/* Role Management */}
                        <div className="border-t border-slate-700 pt-4">
                            <p className="text-sm text-secondary mb-2">Change Role</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onRoleChange('user')}
                                    disabled={user.role === 'user' || roleLoading}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${user.role === 'user'
                                            ? 'bg-slate-500/20 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'
                                        }`}
                                >
                                    Set as User
                                </button>
                                <button
                                    onClick={() => onRoleChange('admin')}
                                    disabled={user.role === 'admin' || roleLoading}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${user.role === 'admin'
                                            ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed'
                                            : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                        }`}
                                >
                                    Set as Admin
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Expenses' && (
                    <div className="space-y-4">
                        {(!activity?.records?.expenses || activity.records.expenses.length === 0) ? (
                            <p className="text-muted text-center py-6">No expense records</p>
                        ) : (
                            activity.records.expenses.map(month => (
                                <div key={month.month} className="border border-slate-700 rounded-lg overflow-hidden">
                                    <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50">
                                        <span className="font-medium text-main">{month.month}</span>
                                        <span className="text-sm text-rose-400">
                                            {month.count} items • {formatCurrency(month.totalUSD, 'USD')}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-700/50">
                                        {month.items.map((item, idx) => (
                                            <div key={idx} className="px-4 py-2 text-sm flex justify-between items-center">
                                                <div>
                                                    <span className="text-main">{item.title}</span>
                                                    <span className="text-xs text-muted ml-2">{item.category}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-rose-400">
                                                        {formatCurrency(item.amount, item.currency)}
                                                    </span>
                                                    {item.currency !== 'USD' && (
                                                        <span className="text-xs text-muted ml-1">
                                                            ({formatCurrency(item.amountUSD, 'USD')})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Incomes' && (
                    <div className="space-y-4">
                        {(!activity?.records?.incomes || activity.records.incomes.length === 0) ? (
                            <p className="text-muted text-center py-6">No income records</p>
                        ) : (
                            activity.records.incomes.map(month => (
                                <div key={month.month} className="border border-slate-700 rounded-lg overflow-hidden">
                                    <div className="flex justify-between items-center px-4 py-2 bg-slate-800/50">
                                        <span className="font-medium text-main">{month.month}</span>
                                        <span className="text-sm text-emerald-400">
                                            {month.count} items • {formatCurrency(month.totalUSD, 'USD')}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-700/50">
                                        {month.items.map((item, idx) => (
                                            <div key={idx} className="px-4 py-2 text-sm flex justify-between items-center">
                                                <div>
                                                    <span className="text-main">{item.title}</span>
                                                    <span className="text-xs text-muted ml-2">{item.category}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-emerald-400">
                                                        {formatCurrency(item.amount, item.currency)}
                                                    </span>
                                                    {item.currency !== 'USD' && (
                                                        <span className="text-xs text-muted ml-1">
                                                            ({formatCurrency(item.amountUSD, 'USD')})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Subscriptions' && (
                    <div className="space-y-2">
                        {(!activity?.records?.subscriptions || activity.records.subscriptions.length === 0) ? (
                            <p className="text-muted text-center py-6">No subscriptions</p>
                        ) : (
                            activity.records.subscriptions.map((sub, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-slate-800/50 flex justify-between items-center">
                                    <div>
                                        <span className="text-main font-medium">{sub.name}</span>
                                        <div className="text-xs text-muted">
                                            {sub.category} • {sub.frequency}
                                            <span className={`ml-2 px-1.5 py-0.5 rounded ${sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-blue-400">{formatCurrency(sub.price, sub.currency)}</span>
                                        {sub.currency !== 'USD' && (
                                            <p className="text-xs text-muted">{formatCurrency(sub.amountUSD, 'USD')}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Budgets' && (
                    <div className="space-y-2">
                        {(!activity?.records?.budgets || activity.records.budgets.length === 0) ? (
                            <p className="text-muted text-center py-6">No budgets</p>
                        ) : (
                            activity.records.budgets.map((budget, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-slate-800/50 flex justify-between items-center">
                                    <div>
                                        <span className="text-main font-medium">{budget.category}</span>
                                        <p className="text-xs text-muted">{budget.year}-{String(budget.month).padStart(2, '0')}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-amber-400">{formatCurrency(budget.limit, budget.currency || 'USD')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

function AdminUsers() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [roleFilter, setRoleFilter] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

    // Fetch users list
    const { data: usersData, isLoading, refetch } = useQuery({
        queryKey: userKeys.list({ page, search, role: roleFilter }),
        queryFn: () => getAllUsers({ page, limit: 15, search, role: roleFilter }),
        keepPreviousData: true,
    })

    // Fetch selected user details
    const { data: userDetailData, isLoading: detailLoading } = useQuery({
        queryKey: userKeys.detail(selectedUser),
        queryFn: () => getUserDetails(selectedUser),
        enabled: !!selectedUser,
    })

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }) => updateUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            setSelectedUser(null)
        },
    })

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: (userId) => deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            setShowDeleteConfirm(null)
        },
    })

    const handleSearch = useCallback((e) => {
        e.preventDefault()
        setPage(1)
        refetch()
    }, [refetch])

    const users = usersData?.data ?? []
    const pagination = usersData?.pagination ?? {}

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-main">User Management</h1>
                <p className="text-secondary mt-1">
                    Manage all platform users, roles, and permissions
                </p>
            </div>

            {/* Search and Filters */}
            <div className="glass-card rounded-2xl p-4">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg px-4 py-2 text-sm bg-slate-800/50 border border-slate-700 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value)
                            setPage(1)
                        }}
                        className="rounded-lg px-4 py-2 text-sm bg-slate-800/50 border border-slate-700"
                    >
                        <option value="">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Users Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Currency</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-muted">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <Motion.tr
                                                key={user._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-main">{user.name}</p>
                                                        <p className="text-xs text-muted">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-300'
                                                        : 'bg-slate-500/20 text-slate-300'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-secondary">
                                                    {user.defaultCurrency || 'USD'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-secondary">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedUser(user._id)}
                                                            className="p-2 rounded-lg text-secondary hover:text-main hover:bg-slate-700/50 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(user._id)}
                                                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </Motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700">
                                <p className="text-sm text-secondary">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 rounded text-sm text-secondary hover:text-main disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={page === pagination.pages}
                                        className="px-3 py-1 rounded text-sm text-secondary hover:text-main disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        {detailLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : userDetailData ? (
                            <UserDetailContent
                                user={userDetailData.user}
                                activity={userDetailData.activity}
                                onClose={() => setSelectedUser(null)}
                                onRoleChange={(role) => updateRoleMutation.mutate({ userId: selectedUser, role })}
                                roleLoading={updateRoleMutation.isLoading}
                            />
                        ) : (
                            <p className="text-muted text-center py-8">Failed to load user details</p>
                        )}
                    </Motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl p-6 w-full max-w-sm"
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-main mb-2">Delete User?</h3>
                            <p className="text-sm text-secondary mb-6">
                                This will permanently delete the user and all their data. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-700 text-secondary hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteUserMutation.mutate(showDeleteConfirm)}
                                    disabled={deleteUserMutation.isLoading}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                                >
                                    {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </Motion.div>
                </div>
            )}
        </div>
    )
}

export default AdminUsers
