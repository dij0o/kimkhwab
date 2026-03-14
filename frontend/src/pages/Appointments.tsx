import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';

import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { useFeedback } from '../feedback/FeedbackProvider';

export const Appointments: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { notify, confirm } = useFeedback();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);

    // Dropdown Data States
    const [customers, setCustomers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Modal States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [formData, setFormData] = useState({
        customer_id: '',
        employee_id: '',
        service_category_id: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        status: 'booked'
    });

    // 1. Fetch Everything on Load
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [apptRes, custRes, empRes, catRes] = await Promise.all([
                apiClient.get('/appointments/?limit=500'),
                apiClient.get('/customers/?limit=500'),
                apiClient.get('/employees/?limit=100'),
                apiClient.get('/services/categories?limit=100')
            ]);

            // Filter Dropdown Data
            setCustomers(custRes.data.data.filter((c: any) => c.is_active !== false));
            setEmployees(empRes.data.data.filter((e: any) => e.is_active));
            setCategories(catRes.data.data.filter((c: any) => c.is_active));

            // Map Appointments to FullCalendar Format
            const mappedEvents = apptRes.data.data.map((appt: any) => {
                // If the appointment is cancelled, fade it out visually
                const isCancelled = appt.status === 'cancelled';
                const bgColor = isCancelled ? '#e9ecef' : (appt.category?.background_color || '#3788d8');
                const txtColor = isCancelled ? '#6c757d' : (appt.category?.text_color || '#ffffff');

                return {
                    id: appt.id.toString(),
                    title: `${appt.customer?.full_name || 'Walk-in'} - ${appt.category?.name || 'Service'}`,
                    start: appt.start_time,
                    end: appt.end_time,
                    backgroundColor: bgColor,
                    borderColor: bgColor,
                    textColor: txtColor,
                    extendedProps: {
                        status: appt.status,
                        customerName: appt.customer?.full_name || 'Walk-in',
                        stylist: appt.employee?.full_name,
                        serviceCategory: appt.category?.name,
                        raw: appt // Store the raw data for editing
                    }
                };
            });

            setEvents(mappedEvents);
        } catch (error) {
            console.error("Failed to load calendar data:", error);
            notify({ title: 'Connection Error', message: 'Failed to connect to server.', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Listen for dashboard redirects to auto-open the modal
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            handleOpenNewModal();
            // Clear the parameter so it doesn't re-open if they refresh the page
            searchParams.delete('new');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams]);

    // 2. Open Modals and Pre-fill Forms
    const handleOpenNewModal = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            customer_id: '', employee_id: '', service_category_id: '',
            start_date: today, start_time: '10:00', end_date: today, end_time: '11:00', status: 'booked'
        });
        setIsNewModalOpen(true);
    };

    const handleEventClick = (info: EventClickArg) => {
        const appt = info.event.extendedProps.raw;

        // Extract date and time strings for the HTML inputs
        const start = new Date(appt.start_time);
        const end = new Date(appt.end_time);

        setFormData({
            customer_id: appt.customer_id?.toString() || '',
            employee_id: appt.employee_id.toString(),
            service_category_id: appt.service_category_id.toString(),
            start_date: start.toISOString().split('T')[0],
            start_time: start.toISOString().split('T')[1].substring(0, 5),
            end_date: end.toISOString().split('T')[0],
            end_time: end.toISOString().split('T')[1].substring(0, 5),
            status: appt.status
        });

        setSelectedEvent(appt);
        setIsEditModalOpen(true);
    };

    // 3. Save / Update Logic
    const handleSaveAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Combine Date & Time into proper ISO format for backend
            const startDateTime = new Date(`${formData.start_date}T${formData.start_time}:00`).toISOString();
            const endDateTime = new Date(`${formData.end_date}T${formData.end_time}:00`).toISOString();

            const payload = {
                customer_id: formData.customer_id ? Number(formData.customer_id) : null,
                employee_id: Number(formData.employee_id),
                service_category_id: Number(formData.service_category_id),
                start_time: startDateTime,
                end_time: endDateTime,
                status: formData.status
            };

            if (isEditModalOpen && selectedEvent) {
                await apiClient.put(`/appointments/${selectedEvent.id}`, payload);
            } else {
                await apiClient.post('/appointments/', payload);
            }

            setIsNewModalOpen(false);
            setIsEditModalOpen(false);
            notify({
                title: isEditModalOpen ? 'Appointment Updated' : 'Appointment Created',
                message: isEditModalOpen ? 'The appointment has been updated successfully.' : 'The appointment has been created successfully.',
                type: 'success'
            });
            fetchAllData(); // Refresh the calendar
        } catch (error: any) {
            console.error("Failed to save:", error);
            notify({ title: 'Save Failed', message: error.response?.data?.detail || 'An error occurred while saving the appointment.', type: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Quick Action to instantly Cancel
    const handleCancelAppointment = async () => {
        if (!selectedEvent) return;

        const shouldCancel = await confirm({
            title: 'Cancel Appointment',
            message: 'Are you sure you want to cancel this appointment?',
            confirmLabel: 'Cancel Appointment',
            confirmTone: 'danger'
        });

        if (!shouldCancel) return;

        setIsSubmitting(true);
        try {
            await apiClient.put(`/appointments/${selectedEvent.id}`, { status: 'cancelled' });
            setIsEditModalOpen(false);
            notify({ title: 'Appointment Cancelled', message: 'The appointment has been cancelled.', type: 'success' });
            fetchAllData();
        } catch (error) {
            console.error("Failed to cancel:", error);
            notify({ title: 'Cancellation Failed', message: 'Failed to cancel the appointment.', type: 'danger' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. Handle Drag & Drop Rescheduling directly on the Calendar
    const handleEventDrop = async (info: EventDropArg) => {
        const apptId = info.event.id;
        const newStart = info.event.start?.toISOString();
        const newEnd = info.event.end?.toISOString() || newStart; // Fallback if dragged without end time

        try {
            await apiClient.put(`/appointments/${apptId}`, { start_time: newStart, end_time: newEnd });
            // Let the calendar UI handle the move visually without reloading the whole page
        } catch (error) {
            notify({ title: 'Reschedule Failed', message: 'Failed to reschedule appointment.', type: 'danger' });
            info.revert(); // Snap the event back to its original slot if the API fails
        }
    };

    return (
        <div className="container-fluid">
            <style>{`
                .fc .fc-button-primary { background-color: #ffffff; border: 1px solid #dee2e6; color: #6c757d; box-shadow: none !important; text-transform: capitalize; font-weight: 400; }
                .fc .fc-button-primary:hover { background-color: #f8f9fa; color: #343a40; }
                .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: var(--primary, #e8a8c3); border-color: var(--primary, #e8a8c3); color: #ffffff; }
                .fc .fc-toolbar-title { font-weight: 600; color: #343a40; }
                .fc-theme-standard th, .fc-theme-standard td { border-color: #e8e8e8; }
                /* Strikethrough text for cancelled events */
                .fc-event-cancelled .fc-event-title { text-decoration: line-through; }
            `}</style>

            <PageHeader title="Calendar">
                <button type="button" className="btn btn-primary" onClick={handleOpenNewModal}>
                    <span className="fe fe-plus fe-16 mr-2"></span>New Appointment
                </button>
            </PageHeader>

            <Card>
                {loading ? <Spinner text="Loading calendar..." /> : (
                    <div id="calendar">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{ left: 'today prev,next', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth' }}
                            events={events}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            editable={true} // Allows drag & drop rescheduling!
                            eventDisplay="block"
                            height="auto"
                            allDaySlot={false}
                            slotMinTime="08:00:00" // Assuming salon opens at 8am
                            slotMaxTime="21:00:00" // Assuming salon closes at 9pm
                            eventClassNames={(arg) => {
                                if (arg.event.extendedProps.status === 'cancelled') return ['fc-event-cancelled'];
                                return [];
                            }}
                        />
                    </div>
                )}
            </Card>

            {/* --- REUSABLE FORM FOR NEW & EDIT --- */}
            <Modal
                isOpen={isNewModalOpen || isEditModalOpen}
                onClose={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }}
                title={isEditModalOpen ? "Edit Appointment" : "New Appointment"}
                isSlide={true}
                footer={
                    <div className="d-flex justify-content-between w-100">
                        {/* LEFT SIDE BUTTONS */}
                        <div>
                            {isEditModalOpen ? (
                                <button type="button" className="btn btn-outline-danger" onClick={handleCancelAppointment} disabled={isSubmitting || formData.status === 'cancelled'}>
                                    Cancel Appointment
                                </button>
                            ) : <div></div>}
                        </div>

                        {/* RIGHT SIDE BUTTONS */}
                        <div>
                            <button type="button" className="btn btn-secondary mr-2" onClick={() => { setIsNewModalOpen(false); setIsEditModalOpen(false); }} disabled={isSubmitting}>Close</button>

                            {/* THE CHECKOUT BUTTON */}
                            {isEditModalOpen && selectedEvent && formData.status !== 'cancelled' && (
                                <button type="button" className="btn btn-success text-white mr-2" onClick={() => navigate(`/invoices/create?appointmentId=${selectedEvent.id}`)}>
                                    <i className="fe fe-check-circle mr-2"></i>Checkout
                                </button>
                            )}

                            <button type="button" className="btn btn-primary" onClick={handleSaveAppointment} disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (isEditModalOpen ? "Update Booking" : "Create Booking")}
                            </button>
                        </div>
                    </div>
                }
            >
                <form>
                    <div className="form-group">
                        <label>Customer Name <span className="text-muted small">(Leave blank for Walk-in)</span></label>
                        <select className="form-control" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} disabled={isSubmitting}>
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone_number})</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Service Category</label>
                        <select className="form-control" value={formData.service_category_id} onChange={e => setFormData({ ...formData, service_category_id: e.target.value })} disabled={isSubmitting} required>
                            <option value="">Select Service Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Assigned Stylist</label>
                        <select className="form-control" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} disabled={isSubmitting} required>
                            <option value="">Select Stylist</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} {e.designation ? `(${e.designation})` : ''}</option>)}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label>Start Date</label>
                            <input type="date" className="form-control" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} disabled={isSubmitting} required />
                        </div>
                        <div className="form-group col-md-6">
                            <label>Start Time</label>
                            <input type="time" className="form-control" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} disabled={isSubmitting} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label>End Date</label>
                            <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={isSubmitting} required />
                        </div>
                        <div className="form-group col-md-6">
                            <label>End Time</label>
                            <input type="time" className="form-control" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} disabled={isSubmitting} required />
                        </div>
                    </div>

                    {isEditModalOpen && (
                        <div className="form-group">
                            <label>Booking Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} disabled={isSubmitting}>
                                <option value="booked">Booked</option>
                                <option value="completed">Completed</option>
                                <option value="no_show">No Show</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
};
