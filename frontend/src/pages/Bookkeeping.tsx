import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { TableCard } from '../components/TableCard';
import { useFeedback } from '../feedback/FeedbackProvider';

interface LedgerEntry {
    id: number;
    amount: number;
    entry_type: 'income' | 'expense';
    category: string;
    description: string;
    reference_id: string | null;
    created_at: string;
}

interface FinancialSummary {
    total_income: number;
    total_expense: number;
    balance: number;
}

export const Bookkeeping: React.FC = () => {
    const { notify, confirm } = useFeedback();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [summary, setSummary] = useState<FinancialSummary>({ total_income: 0, total_expense: 0, balance: 0 });
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    // Modal States
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialFormState = { amount: '', category: '', description: '', reference_id: '' };
    const [formData, setFormData] = useState(initialFormState);

    const incomeCategories = ['Service Sales', 'Product Sales', 'Tips', 'Other Income'];
    const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Equipment', 'Marketing', 'Maintenance', 'Salary', 'Other Expense'];

    const fetchLedgerData = async (page: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;

            // Fetch ledger entries
            const response = await apiClient.get(`/financials/ledger/?skip=${skip}&limit=${limit}`);
            setEntries(response.data.data);
            setMeta(response.data.meta);

            // Fetch summary (we calculate dynamically here if a specific summary endpoint doesn't exist yet)
            try {
                const summaryRes = await apiClient.get('/financials/summary');
                setSummary(summaryRes.data.data);
            } catch {
                // Fallback: Calculate summary purely from the fetched paginated records for demo purposes
                const inc = response.data.data.filter((e: any) => e.entry_type === 'income').reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                const exp = response.data.data.filter((e: any) => e.entry_type === 'expense').reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                setSummary({ total_income: inc, total_expense: exp, balance: inc - exp });
            }

        } catch (err) {
            console.error("Failed to load ledger", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgerData(1, 15);
    }, []);

    const handleSaveEntry = async (entryType: 'income' | 'expense') => {
        if (!formData.amount || !formData.category || !formData.description) {
            notify({ title: 'Missing Information', message: 'Amount, Category, and Description are required.', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/financials/ledger', {
                amount: Number(formData.amount),
                entry_type: entryType,
                category: formData.category,
                description: formData.description,
                reference_id: formData.reference_id || null
            });

            setFormData(initialFormState);
            setIsIncomeModalOpen(false);
            setIsExpenseModalOpen(false);
            notify({
                title: entryType === 'income' ? 'Income Recorded' : 'Expense Recorded',
                message: entryType === 'income' ? 'The income entry has been added.' : 'The expense entry has been added.',
                type: 'success'
            });
            fetchLedgerData(1, 15);
        } catch (error: any) {
            notify({ title: 'Save Failed', message: error.response?.data?.detail || `Failed to add ${entryType}.`, type: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const shouldDelete = await confirm({
            title: 'Delete Transaction',
            message: 'Are you sure you want to permanently delete this transaction?',
            confirmLabel: 'Delete Transaction',
            confirmTone: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            await apiClient.delete(`/financials/ledger/${id}`);
            notify({ title: 'Transaction Deleted', message: 'The transaction has been removed.', type: 'success' });
            fetchLedgerData(meta?.current_page || 1, 15);
        } catch (error) {
            notify({ title: 'Delete Failed', message: 'Failed to delete transaction.', type: 'danger' });
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Bookkeeping & Ledger">
                <button className="btn btn-success text-white mr-2" onClick={() => { setFormData(initialFormState); setIsIncomeModalOpen(true); }}>
                    <i className="fe fe-plus-circle mr-2"></i>Add Income
                </button>
                <button className="btn btn-danger text-white" onClick={() => { setFormData(initialFormState); setIsExpenseModalOpen(true); }}>
                    <i className="fe fe-minus-circle mr-2"></i>Add Expense
                </button>
            </PageHeader>

            {/* Financial Metric Cards */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <Card bodyClassName="text-center py-4" className="h-100">
                        <p className="text-muted mb-2 text-uppercase small font-weight-bold">Total Balance</p>
                        <h3 className="mb-0 text-primary">Rs. {summary.balance.toLocaleString()}</h3>
                    </Card>
                </div>
                <div className="col-md-4">
                    <Card bodyClassName="text-center py-4" className="h-100">
                        <p className="text-muted mb-2 text-uppercase small font-weight-bold">Total Income</p>
                        <h3 className="mb-0 text-success">Rs. {summary.total_income.toLocaleString()}</h3>
                    </Card>
                </div>
                <div className="col-md-4">
                    <Card bodyClassName="text-center py-4" className="h-100">
                        <p className="text-muted mb-2 text-uppercase small font-weight-bold">Total Expenses</p>
                        <h3 className="mb-0 text-danger">Rs. {summary.total_expense.toLocaleString()}</h3>
                    </Card>
                </div>
            </div>

            {/* Ledger Table */}
            <TableCard
                loading={loading}
                loadingText="Loading ledger..."
                isEmpty={entries.length === 0}
                emptyState={<EmptyState icon="fe-book" title="Ledger is Empty" description="No financial transactions have been recorded yet." />}
                noPadding={true}
                responsive={true}
                stateContainerClassName="p-5"
            >
                <table className="table table-hover table-borderless mb-0">
                    <thead className="thead-light border-bottom">
                        <tr>
                            <th className="pl-4">ID</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Reference</th>
                            <th className="text-right">Amount</th>
                            <th className="text-center">Type</th>
                            <th className="text-right pr-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => {
                            const isIncome = entry.entry_type === 'income';
                            return (
                                <tr key={entry.id}>
                                    <td className="pl-4 text-muted">#{entry.id}</td>
                                    <td>
                                        <strong>{new Date(entry.created_at).toLocaleDateString()}</strong><br />
                                        <small className="text-muted">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                    </td>
                                    <td>{entry.description}</td>
                                    <td><span className="badge badge-light border">{entry.category}</span></td>
                                    <td className="text-muted small">{entry.reference_id || '-'}</td>
                                    <td className={`text-right font-weight-bold ${isIncome ? 'text-success' : 'text-danger'}`}>
                                        {isIncome ? '+' : '-'} Rs. {Number(entry.amount).toLocaleString()}
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge badge-pill ${isIncome ? 'badge-success text-white' : 'badge-danger text-white'}`}>
                                            {entry.entry_type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-right pr-4">
                                        <button className="btn btn-sm btn-link text-muted" onClick={() => handleDelete(entry.id)}>
                                            <i className="fe fe-trash-2 text-danger"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </TableCard>

            <div className="mt-3 mb-5">
                <Pagination meta={meta} onPageChange={fetchLedgerData} />
            </div>

            {/* --- ADD INCOME MODAL --- */}
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Add Income" isSlide={true} footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsIncomeModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                    <button type="button" className="btn btn-success text-white" onClick={() => handleSaveEntry('income')} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Income"}</button>
                </>
            }>
                <form>
                    <div className="form-group">
                        <label>Amount</label>
                        <div className="input-group">
                            <div className="input-group-prepend"><span className="input-group-text">Rs.</span></div>
                            <input type="number" className="form-control text-success font-weight-bold" placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                            <option value="">Select Category</option>
                            {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input type="text" className="form-control" placeholder="e.g., Sold 2 bottles of shampoo" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Reference ID <span className="text-muted small">(Optional)</span></label>
                        <input type="text" className="form-control" placeholder="e.g., Receipt #104" value={formData.reference_id} onChange={e => setFormData({ ...formData, reference_id: e.target.value })} />
                    </div>
                </form>
            </Modal>

            {/* --- ADD EXPENSE MODAL --- */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Expense" isSlide={true} footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                    <button type="button" className="btn btn-danger text-white" onClick={() => handleSaveEntry('expense')} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Expense"}</button>
                </>
            }>
                <form>
                    <div className="form-group">
                        <label>Amount</label>
                        <div className="input-group">
                            <div className="input-group-prepend"><span className="input-group-text">Rs.</span></div>
                            <input type="number" className="form-control text-danger font-weight-bold" placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                            <option value="">Select Category</option>
                            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input type="text" className="form-control" placeholder="e.g., Electricity Bill - Jan 2026" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Reference / Invoice # <span className="text-muted small">(Optional)</span></label>
                        <input type="text" className="form-control" placeholder="e.g., INV-9021" value={formData.reference_id} onChange={e => setFormData({ ...formData, reference_id: e.target.value })} />
                    </div>
                </form>
            </Modal>

        </div>
    );
};
