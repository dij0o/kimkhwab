import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';

interface Invoice {
    id: number;
    start_time: string;
    end_time: string;
    total_amount: number;
    paid: boolean;
    snapshot?: {
        customer_name?: string;
        cashier_username?: string;
        items?: { service_name: string; unit_price: number; quantity: number }[];
    };
}

export const Invoices: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    // Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refund State
    const [refundAmount, setRefundAmount] = useState<number | ''>('');
    const [refundReason, setRefundReason] = useState<string>('');

    const fetchInvoices = async (page: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const response = await apiClient.get(`/invoices/?skip=${skip}&limit=${limit}`);
            setInvoices(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error("Failed to load invoices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(1, 10);
    }, []);

    const openViewModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const openRefundModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setRefundAmount(invoice.total_amount); // Default to full refund
        setRefundReason(`Credit Note / Correction for Invoice #${invoice.id.toString().padStart(4, '0')}`);
        setIsRefundModalOpen(true);
    };

    const handleIssueRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice || !refundAmount || !refundReason) return;

        setIsSubmitting(true);
        try {
            // We issue a Credit Note by posting an Expense to the Ledger
            // referencing this specific invoice ID.
            await apiClient.post('/financials/ledger', {
                amount: Number(refundAmount),
                entry_type: 'expense',
                category: 'Refund / Credit Note',
                description: refundReason,
                reference_id: `INV-${selectedInvoice.id.toString().padStart(4, '0')}`
            });

            setIsRefundModalOpen(false);
            alert(`Successfully issued a credit note for Rs. ${refundAmount.toLocaleString()}`);
            // No need to reload invoices, as the invoice itself remains untouched!

        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to process credit note.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Invoices">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
                    <span className="fe fe-plus fe-12 mr-2"></span>Create New Invoice
                </button>
            </PageHeader>

            <Card noPadding>
                {loading ? (
                    <div className="p-4"><Spinner text="Loading invoices..." /></div>
                ) : invoices.length === 0 ? (
                    <div className="p-4"><EmptyState icon="fe-file-text" title="No Invoices Found" description="Complete an appointment to generate an invoice." /></div>
                ) : (
                    <table className="table table-borderless table-hover mb-0">
                        <thead className="thead-light">
                            <tr>
                                <th className="pl-4">Invoice ID</th>
                                <th>Date / Time</th>
                                <th>Customer</th>
                                <th>Services</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th className="pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => {
                                const invDate = new Date(inv.start_time);
                                return (
                                    <tr key={inv.id}>
                                        <td className="pl-4"><strong>#{inv.id.toString().padStart(4, '0')}</strong></td>
                                        <td>
                                            {invDate.toLocaleDateString()}<br />
                                            <small className="text-muted">{invDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </td>
                                        <td>{inv.snapshot?.customer_name || 'Walk-in'}</td>
                                        <td>
                                            <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                                {inv.snapshot?.items?.map(i => i.service_name).join(', ')}
                                            </span>
                                        </td>
                                        <td><strong>Rs. {Number(inv.total_amount).toLocaleString()}</strong></td>
                                        <td>
                                            {inv.paid ? (
                                                <span className="badge badge-pill badge-primary">Paid</span>
                                            ) : (
                                                <span className="badge badge-pill badge-secondary">Unpaid</span>
                                            )}
                                        </td>
                                        <td className="pr-4">
                                            <Dropdown>
                                                <button className="dropdown-item" onClick={() => openViewModal(inv)}>
                                                    <i className="fe fe-eye mr-2"></i> View Details
                                                </button>
                                                <button className="dropdown-item" onClick={() => window.print()}>
                                                    <i className="fe fe-printer mr-2"></i> Print
                                                </button>
                                                {inv.paid && (
                                                    <button className="dropdown-item text-danger" onClick={() => openRefundModal(inv)}>
                                                        <i className="fe fe-refresh-cw mr-2"></i> Issue Credit Note
                                                    </button>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </Card>

            <div className="mt-3">
                <Pagination meta={meta} onPageChange={fetchInvoices} />
            </div>

            {/* --- VIEW INVOICE MODAL --- */}
            {selectedInvoice && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Invoice #${selectedInvoice.id.toString().padStart(4, '0')}`} footer={
                    <button type="button" className="btn btn-primary" onClick={() => window.print()}><i className="fe fe-printer mr-2"></i>Print Receipt</button>
                }>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <p className="text-muted mb-1">Billed To</p>
                            <h5 className="mb-0">{selectedInvoice.snapshot?.customer_name || 'Walk-in Customer'}</h5>
                        </div>
                        <div className="col-md-6 text-right">
                            <p className="text-muted mb-1">Date</p>
                            <h5 className="mb-0">{new Date(selectedInvoice.start_time).toLocaleDateString()}</h5>
                        </div>
                    </div>
                    <table className="table table-sm table-borderless bg-light rounded">
                        <thead>
                            <tr className="border-bottom">
                                <th>Service</th>
                                <th className="text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedInvoice.snapshot?.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.service_name}</td>
                                    <td className="text-right">Rs. {Number(item.unit_price).toLocaleString()}</td>
                                </tr>
                            ))}
                            <tr className="border-top">
                                <td className="py-3"><strong>Total Amount</strong></td>
                                <td className="py-3 text-right"><strong>Rs. {Number(selectedInvoice.total_amount).toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-4 d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Cashier: {selectedInvoice.snapshot?.cashier_username || 'System'}</span>
                        {selectedInvoice.paid ? <span className="badge badge-primary">PAID IN FULL</span> : <span className="badge badge-secondary">UNPAID</span>}
                    </div>
                </Modal>
            )}

            {/* --- REFUND / CREDIT NOTE MODAL --- */}
            {selectedInvoice && (
                <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Issue Credit Note / Refund" isSlide={false} footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsRefundModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={handleIssueRefund} disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Process Adjustment"}
                        </button>
                    </>
                }>
                    <div className="alert alert-info">
                        <i className="fe fe-info mr-2"></i>
                        Invoices cannot be altered after payment. Processing this will create a balancing expense entry in your Ledger.
                    </div>
                    <form>
                        <div className="form-group">
                            <label>Amount to Refund / Credit</label>
                            <div className="input-group">
                                <div className="input-group-prepend"><span className="input-group-text">Rs.</span></div>
                                <input
                                    type="number"
                                    className="form-control font-weight-bold text-danger"
                                    value={refundAmount}
                                    max={selectedInvoice.total_amount}
                                    onChange={e => setRefundAmount(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <small className="form-text text-muted">Original Invoice Total: Rs. {selectedInvoice.total_amount.toLocaleString()}</small>
                        </div>
                        <div className="form-group">
                            <label>Reason / Description</label>
                            <input
                                type="text"
                                className="form-control"
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                required
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};