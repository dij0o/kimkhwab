import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';

interface LineItem {
    id: number;
    service_id: string;
    qty: number;
}

export const InvoiceCreate: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data Sources
    const [customers, setCustomers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);

    // Form State
    const [customerId, setCustomerId] = useState<string>('');
    const [employeeId, setEmployeeId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('11:00');
    const [isPaid, setIsPaid] = useState(true);
    const [notes, setNotes] = useState('');

    // Line Items State
    const [lineItems, setLineItems] = useState<LineItem[]>([{ id: Date.now(), service_id: '', qty: 1 }]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [custRes, empRes, svcRes] = await Promise.all([
                    apiClient.get('/customers/?limit=500'),
                    apiClient.get('/employees/?limit=100'),
                    apiClient.get('/services/?limit=100')
                ]);

                setCustomers(custRes.data.data.filter((c: any) => c.is_active !== false));
                setEmployees(empRes.data.data.filter((e: any) => e.is_active));
                setServices(svcRes.data.data.filter((s: any) => s.is_active));

                // If launched from an appointment, fetch it and pre-fill the form!
                if (appointmentId) {
                    const apptRes = await apiClient.get(`/appointments/?id=${appointmentId}`);
                    const appt = apptRes.data.data.find((a: any) => a.id.toString() === appointmentId);

                    if (appt) {
                        if (appt.customer_id) setCustomerId(appt.customer_id.toString());
                        if (appt.employee_id) setEmployeeId(appt.employee_id.toString());

                        const start = new Date(appt.start_time);
                        const end = new Date(appt.end_time);
                        setDate(start.toISOString().split('T')[0]);
                        setStartTime(start.toISOString().split('T')[1].substring(0, 5));
                        setEndTime(end.toISOString().split('T')[1].substring(0, 5));
                    }
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [appointmentId]);

    // Selected Customer Details for the UI Card
    const selectedCustomer = customers.find(c => c.id.toString() === customerId);

    // Calculations
    const calculateTotal = () => {
        return lineItems.reduce((total, item) => {
            const svc = services.find(s => s.id.toString() === item.service_id);
            return total + (svc ? Number(svc.price) * item.qty : 0);
        }, 0);
    };
    const grandTotal = calculateTotal();

    // Line Item Handlers
    const addLineItem = () => setLineItems([...lineItems, { id: Date.now(), service_id: '', qty: 1 }]);
    const removeLineItem = (id: number) => setLineItems(lineItems.filter(item => item.id !== id));

    const updateLineItem = (id: number, field: keyof LineItem, value: any) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSaveInvoice = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const validItems = lineItems.filter(item => item.service_id !== '');
        if (validItems.length === 0) return alert("Please select at least one service.");
        if (!employeeId) return alert("Please select a staff member.");

        setIsSubmitting(true);

        try {
            const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
            const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

            const itemsPayload = validItems.map(item => {
                const svc = services.find(s => s.id.toString() === item.service_id);
                return {
                    service_id: Number(item.service_id),
                    unit_price: Number(svc.price),
                    quantity: item.qty,
                    employee_id: Number(employeeId) // Stylist gets the credit
                };
            });

            const payload = {
                customer_id: customerId ? Number(customerId) : null,
                employee_id: Number(employeeId),
                start_time: startDateTime,
                end_time: endDateTime,
                total_amount: grandTotal,
                paid: isPaid,
                notes: notes || null,
                items: itemsPayload
            };

            // 1. Create the Invoice
            await apiClient.post('/invoices/', payload);

            // 2. If it was linked to an appointment, mark that appointment as Completed
            if (appointmentId) {
                await apiClient.put(`/appointments/${appointmentId}`, { status: 'completed' });
            }

            // 3. Redirect back to invoices list
            navigate('/invoices');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.detail || "Failed to save invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="mt-5"><Spinner text="Loading checkout..." /></div>;

    return (
        <div className="container-fluid">
            {/* The properly upgraded PageHeader! */}
            <PageHeader
                title={
                    <>
                        Create Invoice
                        {appointmentId && <span className="badge badge-light ml-2 border" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>Linked to Appt #{appointmentId}</span>}
                    </>
                }
            >
                <button type="button" className="btn btn-secondary mr-2" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveInvoice} disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Save & Charge"}
                </button>
            </PageHeader>

            <div className="row">
                {/* LEFT COLUMN: Customer & Services */}
                <div className="col-lg-8">

                    <Card title={
                        <div className="d-flex justify-content-between align-items-center">
                            <span>Customer</span>
                            {!customerId && <span className="badge badge-secondary" style={{ backgroundColor: '#e9ecef', color: '#6c757d' }}>Walk-in</span>}
                        </div>
                    }>
                        <div className="form-group mb-0">
                            <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)} disabled={isSubmitting}>
                                <option value="">Walk-in Customer (No Profile)</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone_number})</option>)}
                            </select>
                        </div>

                        {selectedCustomer && (
                            <div className="mt-3 p-3 bg-light rounded d-flex align-items-center">
                                <Avatar src={selectedCustomer.profile_image_url} size="md" className="mr-3" />
                                <div>
                                    <h6 className="mb-0">{selectedCustomer.full_name}</h6>
                                    <small className="text-muted d-block">{selectedCustomer.phone_number}</small>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card title={
                        <div className="d-flex justify-content-between align-items-center">
                            <span>Services Rendered</span>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLineItem} disabled={isSubmitting}>
                                <i className="fe fe-plus mr-1"></i> Add Service
                            </button>
                        </div>
                    }>
                        <div className="table-responsive">
                            <table className="table table-borderless">
                                <thead className="border-bottom">
                                    <tr>
                                        <th style={{ width: '50%' }}>Service</th>
                                        <th className="text-right">Price</th>
                                        <th style={{ width: '15%' }}>Qty</th>
                                        <th className="text-right">Line Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item) => {
                                        const svc = services.find(s => s.id.toString() === item.service_id);
                                        const price = svc ? Number(svc.price) : 0;
                                        const lineTotal = price * item.qty;

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <select className="form-control" value={item.service_id} onChange={e => updateLineItem(item.id, 'service_id', e.target.value)} disabled={isSubmitting}>
                                                        <option value="">Select a service...</option>
                                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="text-right align-middle text-muted">
                                                    {price > 0 ? `Rs. ${price.toLocaleString()}` : '-'}
                                                </td>
                                                <td>
                                                    <input type="number" className="form-control text-center" min="1" value={item.qty} onChange={e => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 1)} disabled={isSubmitting} />
                                                </td>
                                                <td className="text-right align-middle font-weight-bold">
                                                    Rs. {lineTotal.toLocaleString()}
                                                </td>
                                                <td className="align-middle text-right">
                                                    {lineItems.length > 1 && (
                                                        <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeLineItem(item.id)} disabled={isSubmitting}>
                                                            <i className="fe fe-trash-2"></i>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex flex-column align-items-end mt-4 pt-3 border-top">
                            <div className="w-50">
                                <div className="d-flex justify-content-between mb-2">
                                    <div className="text-muted">Subtotal</div>
                                    <div>Rs. {grandTotal.toLocaleString()}</div>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <div className="text-muted">Discount</div>
                                    <div>Rs. 0.00</div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-2 px-3 bg-light rounded">
                                    <h5 className="mb-0 text-muted">Total</h5>
                                    <h4 className="mb-0 text-primary font-weight-bold">Rs. {grandTotal.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Metadata */}
                <div className="col-lg-4">
                    <Card title="Invoice Details" className="sticky-top" style={{ top: '1.5rem', zIndex: 1 }}>
                        <div className="form-group">
                            <label>Stylist / Staff Member</label>
                            <select className="form-control" value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={isSubmitting} required>
                                <option value="">Select Staff</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group col-12">
                                <label>Date</label>
                                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} disabled={isSubmitting} required />
                            </div>
                            <div className="form-group col-6">
                                <label>Start</label>
                                <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isSubmitting} required />
                            </div>
                            <div className="form-group col-6">
                                <label>End</label>
                                <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isSubmitting} required />
                            </div>
                        </div>

                        <div className="form-group mt-3">
                            <div className="custom-control custom-switch">
                                <input type="checkbox" className="custom-control-input" id="isPaidSwitch" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} disabled={isSubmitting} />
                                <label className="custom-control-label font-weight-bold" htmlFor="isPaidSwitch">
                                    Payment Received?
                                    <small className="d-block text-muted font-weight-normal mt-1">If checked, this revenue will be automatically injected into the Ledger.</small>
                                </label>
                            </div>
                        </div>

                        <div className="form-group mt-4 mb-0">
                            <label>Notes</label>
                            <textarea className="form-control" rows={3} placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} disabled={isSubmitting}></textarea>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};