import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { EmptyState } from '../components/EmptyState';
import { DataTableCard } from '../components/DataTableCard';
import { CustomerQuickCreateModal, type QuickCustomerRecord } from '../components/CustomerQuickCreateModal';
import { useFeedback } from '../feedback/FeedbackProvider';

interface Invoice {
    id: number;
    employee_id?: number | null;
    appointment_id?: number | null;
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

interface EmployeeSummary {
    id: number;
    full_name: string;
    designation?: string | null;
    is_active?: boolean;
}

interface AppointmentRecord {
    id: number;
    customer_id?: number | null;
    employee_id?: number | null;
    start_time: string;
    end_time: string;
    status: string;
    customer?: { full_name?: string | null } | null;
    employee?: { full_name?: string | null } | null;
    category?: { name?: string | null } | null;
}

const DATA_TABLE_PAGE_SIZES = [10, 25, 50, 100];
const EMPTY_INVOICES: Invoice[] = [];
const EMPTY_EMPLOYEES: EmployeeSummary[] = [];
const EMPTY_APPOINTMENTS: AppointmentRecord[] = [];
const EMPTY_EMPLOYEE_NAMES: Record<number, string> = {};

const getAppointmentStatusBadgeClass = (status: string): string => {
    if (status === 'completed') {
        return 'badge badge-pill badge-primary';
    }

    if (status === 'cancelled' || status === 'no_show') {
        return 'badge badge-pill badge-secondary';
    }

    return 'badge badge-pill badge-light border text-dark';
};

export const Invoices: React.FC = () => {
    const navigate = useNavigate();
    const { notify } = useFeedback();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState(EMPTY_INVOICES);
    const [employees, setEmployees] = useState(EMPTY_EMPLOYEES);
    const [employeeNames, setEmployeeNames] = useState(EMPTY_EMPLOYEE_NAMES);
    const [appointments, setAppointments] = useState(EMPTY_APPOINTMENTS);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isCustomerCreateModalOpen, setIsCustomerCreateModalOpen] = useState(false);
    const [isAppointmentSelectModalOpen, setIsAppointmentSelectModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refund State
    const [refundAmount, setRefundAmount] = useState<number | ''>('');
    const [refundReason, setRefundReason] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const initialInvoiceResponse = await apiClient.get('/financials/invoices?skip=0&limit=100');
            const initialInvoices = Array.isArray(initialInvoiceResponse.data.data)
                ? initialInvoiceResponse.data.data
                : [];
            const totalInvoiceCount = Number(initialInvoiceResponse.data.meta?.total_records ?? initialInvoices.length);

            const invoiceData = initialInvoices.length < totalInvoiceCount
                ? (await apiClient.get(`/financials/invoices?skip=0&limit=${totalInvoiceCount}`)).data.data
                : initialInvoices;

            const employeeResponse = await apiClient.get('/employees/?limit=500');
            const employeeList: EmployeeSummary[] = Array.isArray(employeeResponse.data.data)
                ? employeeResponse.data.data.filter((employee: EmployeeSummary) => employee.is_active)
                : [];
            const employeeLookup = employeeList.reduce((lookup: Record<number, string>, employee) => {
                lookup[employee.id] = employee.full_name;
                return lookup;
            }, {});

            setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
            setEmployees(employeeList);
            setEmployeeNames(employeeLookup);
        } catch (err) {
            console.error('Failed to load invoices', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        setAppointmentsLoading(true);
        try {
            const response = await apiClient.get('/appointments/?limit=500');
            setAppointments(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error('Failed to load appointments', error);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    useEffect(() => {
        void fetchInvoices();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pageSize]);

    const getStaffName = (invoice: Invoice): string => {
        if (invoice.employee_id && employeeNames[invoice.employee_id]) {
            return employeeNames[invoice.employee_id];
        }

        return invoice.snapshot?.cashier_username || 'Unassigned';
    };

    const getItemSummary = (invoice: Invoice): string => {
        const itemNames = Array.isArray(invoice.snapshot?.items)
            ? invoice.snapshot.items.map((item) => item.service_name).filter(Boolean)
            : [];

        if (itemNames.length === 0) {
            return 'No line items';
        }

        const visibleItems = itemNames.slice(0, 2);
        const remainingCount = itemNames.length - visibleItems.length;

        return remainingCount > 0
            ? `${visibleItems.join(', ')} +${remainingCount} more`
            : visibleItems.join(', ');
    };

    const filteredInvoices = invoices.filter((invoice) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return [
            invoice.id.toString(),
            invoice.snapshot?.customer_name || 'walk-in',
            getStaffName(invoice),
            getItemSummary(invoice),
            invoice.paid ? 'paid' : 'unpaid',
            invoice.appointment_id ? `appointment ${invoice.appointment_id}` : ''
        ].some((value) => value.toLowerCase().includes(query));
    });

    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
    const activePage = Math.min(currentPage, totalPages);
    const pageStart = (activePage - 1) * pageSize;
    const paginatedInvoices = filteredInvoices.slice(pageStart, pageStart + pageSize);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginationMeta: PaginationMeta | null = filteredInvoices.length === 0
        ? null
        : {
            total_records: filteredInvoices.length,
            total_pages: totalPages,
            current_page: activePage,
            limit: pageSize,
            has_next: activePage < totalPages,
            has_prev: activePage > 1
        };

    const availableAppointments = appointments
        .filter((appointment) => !['cancelled', 'no_show'].includes(appointment.status))
        .filter((appointment) => !invoices.some((invoice) => invoice.appointment_id === appointment.id))
        .filter((appointment) => {
            const query = appointmentSearchTerm.trim().toLowerCase();
            if (!query) {
                return true;
            }

            const customerName = appointment.customer?.full_name || 'walk-in';
            const staffName = appointment.employee?.full_name
                || (appointment.employee_id ? employeeNames[appointment.employee_id] : '')
                || 'unassigned';
            const categoryName = appointment.category?.name || '';

            return [
                appointment.id.toString(),
                customerName,
                staffName,
                categoryName,
                appointment.status
            ].some((value) => value.toLowerCase().includes(query));
        })
        .sort((left, right) => new Date(right.start_time).getTime() - new Date(left.start_time).getTime());

    const openViewModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const openRefundModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setRefundAmount(invoice.total_amount);
        setRefundReason(`Credit Note / Correction for Invoice #${invoice.id.toString().padStart(4, '0')}`);
        setIsRefundModalOpen(true);
    };

    const handleIssueRefund = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedInvoice || !refundAmount || !refundReason) {
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/financials/ledger', {
                amount: Number(refundAmount),
                entry_type: 'expense',
                category: 'Refund / Credit Note',
                description: refundReason,
                reference_id: `INV-${selectedInvoice.id.toString().padStart(4, '0')}`
            });

            setIsRefundModalOpen(false);
            notify({ title: 'Credit Note Issued', message: `Successfully issued a credit note for Rs. ${refundAmount.toLocaleString()}.`, type: 'success' });
        } catch (error: any) {
            notify({ title: 'Refund Failed', message: error.response?.data?.detail || 'Failed to process credit note.', type: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWalkInCustomerCreated = (customer: QuickCustomerRecord) => {
        navigate(`/invoices/create?customerId=${customer.id}`);
    };

    const handleOpenAppointmentModal = () => {
        setAppointmentSearchTerm('');
        setIsAppointmentSelectModalOpen(true);
        void fetchAppointments();
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Invoices">
                <>
                    <button
                        type="button"
                        className="btn btn-primary mr-2"
                        onClick={() => setIsCustomerCreateModalOpen(true)}
                    >
                        <span className="fe fe-plus fe-12 mr-2"></span>Create New Invoice for Walk-in
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOpenAppointmentModal}
                    >
                        <span className="fe fe-plus fe-12 mr-2"></span>Create New Invoice from Appointment
                    </button>
                </>
            </PageHeader>

            <DataTableCard
                loading={loading}
                loadingText="Loading invoices..."
                isEmpty={filteredInvoices.length === 0}
                emptyState={<EmptyState icon="fe-file-text" title="No Invoices Found" description="Create a walk-in customer or invoice a booked appointment to get started." />}
                totalRecords={invoices.length}
                filteredRecords={filteredInvoices.length}
                currentPage={activePage}
                pageSize={pageSize}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onPageSizeChange={setPageSize}
                pageSizeOptions={DATA_TABLE_PAGE_SIZES}
                searchPlaceholder="Search invoices..."
                pagination={(
                    <Pagination
                        meta={paginationMeta}
                        onPageChange={(skip, limit) => {
                            setCurrentPage(Math.floor(skip / limit) + 1);
                        }}
                    />
                )}
            >
                <table className="table table-hover datatables mb-0">
                    <thead className="thead-light">
                        <tr>
                            <th className="pl-4">Invoice ID</th>
                            <th>Date / Time</th>
                            <th>Customer</th>
                            <th>Staff</th>
                            <th>Services</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th className="text-center">Appointment</th>
                            <th className="pr-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInvoices.map((invoice) => {
                            const startTime = new Date(invoice.start_time);
                            const endTime = new Date(invoice.end_time);
                            const itemSummary = getItemSummary(invoice);

                            return (
                                <tr key={invoice.id}>
                                    <td className="pl-4"><strong>#{invoice.id.toString().padStart(4, '0')}</strong></td>
                                    <td>
                                        {startTime.toLocaleDateString()}<br />
                                        <small className="text-muted">
                                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </td>
                                    <td>{invoice.snapshot?.customer_name || 'Walk-in'}</td>
                                    <td>{getStaffName(invoice)}</td>
                                    <td>
                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '240px' }} title={itemSummary}>
                                            {itemSummary}
                                        </span>
                                    </td>
                                    <td><strong>Rs. {Number(invoice.total_amount).toLocaleString()}</strong></td>
                                    <td>
                                        {invoice.paid ? (
                                            <span className="badge badge-pill badge-primary">Paid</span>
                                        ) : (
                                            <span className="badge badge-pill badge-secondary">Unpaid</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {invoice.appointment_id ? (
                                            <button
                                                type="button"
                                                className="btn btn-link btn-sm p-0 text-primary"
                                                onClick={() => navigate('/appointments')}
                                                title={`Open appointments for linked appointment #${invoice.appointment_id}`}
                                            >
                                                <span className="fe fe-link fe-14"></span>
                                            </button>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td className="pr-4">
                                        <Dropdown>
                                            <button type="button" className="dropdown-item" onClick={() => openViewModal(invoice)}>
                                                <i className="fe fe-eye mr-2"></i> View Details
                                            </button>
                                            <button type="button" className="dropdown-item" onClick={() => window.print()}>
                                                <i className="fe fe-printer mr-2"></i> Print
                                            </button>
                                            {invoice.paid && (
                                                <button type="button" className="dropdown-item text-danger" onClick={() => openRefundModal(invoice)}>
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
            </DataTableCard>

            <CustomerQuickCreateModal
                isOpen={isCustomerCreateModalOpen}
                onClose={() => setIsCustomerCreateModalOpen(false)}
                onCreated={handleWalkInCustomerCreated}
                employees={employees}
            />

            <Modal
                isOpen={isAppointmentSelectModalOpen}
                onClose={() => setIsAppointmentSelectModalOpen(false)}
                title="Create Invoice from Appointment"
                isSlide={true}
                size="xl"
                footer={(
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAppointmentSelectModalOpen(false)}>
                        Close
                    </button>
                )}
            >
                <div className="form-group">
                    <label htmlFor="appointmentInvoiceSearch">Search Appointments</label>
                    <input
                        id="appointmentInvoiceSearch"
                        type="text"
                        className="form-control"
                        placeholder="Search by appointment ID, customer, staff, category, or status"
                        value={appointmentSearchTerm}
                        onChange={(event) => setAppointmentSearchTerm(event.target.value)}
                    />
                </div>

                {appointmentsLoading ? (
                    <div className="py-5 text-center text-muted">Loading appointments...</div>
                ) : availableAppointments.length === 0 ? (
                    <EmptyState
                        icon="fe-calendar"
                        title="No Appointments Ready"
                        description="There are no invoice-ready appointments that match your search."
                    />
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Staff</th>
                                    <th>Category</th>
                                    <th>Date / Time</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableAppointments.map((appointment) => (
                                    <tr key={appointment.id}>
                                        <td><strong>#{appointment.id}</strong></td>
                                        <td>{appointment.customer?.full_name || 'Walk-in'}</td>
                                        <td>{appointment.employee?.full_name || (appointment.employee_id ? employeeNames[appointment.employee_id] : 'Unassigned')}</td>
                                        <td>{appointment.category?.name || '-'}</td>
                                        <td>
                                            {new Date(appointment.start_time).toLocaleDateString()}<br />
                                            <small className="text-muted">
                                                {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={getAppointmentStatusBadgeClass(appointment.status)}>
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={() => navigate(`/invoices/create?appointmentId=${appointment.id}`)}
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>

            {selectedInvoice && (
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title={`Invoice #${selectedInvoice.id.toString().padStart(4, '0')}`}
                    footer={(
                        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                            <i className="fe fe-printer mr-2"></i>Print Receipt
                        </button>
                    )}
                >
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
                            {selectedInvoice.snapshot?.items?.map((item, index) => (
                                <tr key={index}>
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

            {selectedInvoice && (
                <Modal
                    isOpen={isRefundModalOpen}
                    onClose={() => setIsRefundModalOpen(false)}
                    title="Issue Credit Note / Refund"
                    footer={(
                        <>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsRefundModalOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleIssueRefund} disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Process Adjustment'}
                            </button>
                        </>
                    )}
                >
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
                                    onChange={(event) => setRefundAmount(Number(event.target.value))}
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
                                onChange={(event) => setRefundReason(event.target.value)}
                                required
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
