import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg } from '@fullcalendar/core';

import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';

export const Appointments: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);

    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            // Exact events and colors from your prototype
            setEvents([
                { id: "1", title: "Kasimir Lindsey - Hair Coloring", start: "2025-07-15T14:00:00", end: "2025-07-15T15:30:00", backgroundColor: "#ffb6c1", borderColor: "#ffb6c1", textColor: "#ffffff", extendedProps: { customerName: "Kasimir Lindsey", serviceCategory: "Hair Coloring", stylist: "Sarah Johnson", serviceType: "Hair Dye" } },
                { id: "2", title: "Melinda Levy - Haircut", start: "2025-07-15T15:30:00", end: "2025-07-15T16:30:00", backgroundColor: "#b8ddd1", borderColor: "#b8ddd1", textColor: "#ffffff", extendedProps: { customerName: "Melinda Levy", serviceCategory: "Haircut", stylist: "Michael Chen", serviceType: "Simple Haircut" } },
                { id: "3", title: "Aubrey Sweeney - Hair Treatment", start: "2025-07-16T10:00:00", end: "2025-07-16T11:30:00", backgroundColor: "#dda0dd", borderColor: "#dda0dd", textColor: "#ffffff", extendedProps: { customerName: "Aubrey Sweeney", serviceCategory: "Hair Treatment", stylist: "Emily Davis", serviceType: "Other" } },
                { id: "4", title: "Timon Bauer - Hair Coloring", start: "2025-07-16T11:30:00", end: "2025-07-16T13:00:00", backgroundColor: "#ffb6c1", borderColor: "#ffb6c1", textColor: "#ffffff", extendedProps: { customerName: "Timon Bauer", serviceCategory: "Hair Coloring", stylist: "Sarah Johnson", serviceType: "Hair Dye" } },
                { id: "5", title: "Kelly Barrera - Styling", start: "2025-07-16T14:00:00", end: "2025-07-16T15:00:00", backgroundColor: "#dda0dd", borderColor: "#dda0dd", textColor: "#ffffff", extendedProps: { customerName: "Kelly Barrera", serviceCategory: "Styling", stylist: "Michael Chen", serviceType: "Other" } }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleEventClick = (info: EventClickArg) => {
        const ev = info.event;
        setSelectedEvent({
            id: ev.id,
            customerName: ev.extendedProps.customerName,
            serviceCategory: ev.extendedProps.serviceCategory,
            service: ev.extendedProps.serviceType,
            stylist: ev.extendedProps.stylist,
            startDate: ev.start?.toISOString().split('T')[0],
            startTime: ev.start?.toISOString().split('T')[1].substring(0, 5),
            endDate: ev.end?.toISOString().split('T')[0],
            endTime: ev.end?.toISOString().split('T')[1].substring(0, 5),
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className="container-fluid">

            {/* This CSS block overrides FullCalendar's default blue buttons 
        to perfectly match your template's grey/white/pink styling. 
      */}
            <style>{`
        .fc .fc-button-primary {
          background-color: #ffffff;
          border: 1px solid #dee2e6;
          color: #6c757d;
          box-shadow: none !important;
          text-transform: capitalize;
          font-family: 'Overpass', sans-serif;
          font-weight: 400;
        }
        .fc .fc-button-primary:hover {
          background-color: #f8f9fa;
          color: #343a40;
        }
        /* Active View Button (e.g. Month vs Week) */
        .fc .fc-button-primary:not(:disabled).fc-button-active, 
        .fc .fc-button-primary:not(:disabled):active {
          background-color: var(--primary, #e8a8c3);
          border-color: var(--primary, #e8a8c3);
          color: #ffffff;
        }
        .fc .fc-toolbar-title {
          font-family: 'Overpass', sans-serif;
          font-weight: 600;
          color: #343a40;
        }
        .fc-theme-standard th, .fc-theme-standard td {
          border-color: #e8e8e8;
        }
      `}</style>

            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title="Calendar">
                        <button type="button" className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
                            <span className="fe fe-plus fe-16 mr-2"></span>New Appointment
                        </button>
                    </PageHeader>

                    {loading ? (
                        <Spinner text="Loading calendar..." />
                    ) : (
                        <div id="calendar" style={{ marginTop: '20px' }}>
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                initialDate="2025-07-15"
                                headerToolbar={{
                                    left: 'today prev,next',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                                }}
                                events={events}
                                eventClick={handleEventClick}

                                // 1. Forces events to be solid color blocks!
                                eventDisplay="block"

                                // 2. Restores the tall, spacious day cells!
                                // aspectRatio={1.25}
                                height="auto"

                                buttonText={{
                                    today: 'Today',
                                    month: 'Month',
                                    week: 'Week',
                                    day: 'Day',
                                    list: 'List'
                                }}
                            />
                        </div>
                    )}

                </div>
            </div>

            {/* --- NEW APPOINTMENT SLIDE MODAL --- */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="New Appointment"
                isSlide={true}
                footer={
                    <button type="button" className="btn btn-primary w-100" onClick={() => setIsNewModalOpen(false)}>
                        Create Appointment
                    </button>
                }
            >
                <form>
                    <div className="form-group">
                        <label className="col-form-label">Customer Name</label>
                        <div className="d-flex">
                            <div className="flex-grow-1 mr-2">
                                <select className="form-control">
                                    <option value="">Search for customer...</option>
                                    <option value="1">Brown, Asher D.</option>
                                    <option value="2">Leblanc, Yoshio V.</option>
                                </select>
                            </div>
                            <button type="button" className="btn btn-primary" style={{ height: '38px', width: '38px', padding: 0 }}>
                                <span className="fe fe-plus fe-16"></span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-form-label">Service Category</label>
                        <select className="form-control">
                            <option value="">Select Service Category</option>
                            <option value="1">Hair Coloring</option>
                            <option value="2">Haircut</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="col-form-label">Service</label>
                        <input type="text" className="form-control" placeholder="Enter service" />
                    </div>

                    <div className="form-group">
                        <label className="col-form-label">Preferred Stylist</label>
                        <select className="form-control">
                            <option value="">Select Preferred Stylist</option>
                            <option value="1">Sanaa Ali Awan</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label>Start Date</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><span className="fe fe-calendar fe-16"></span></div>
                                </div>
                                <input type="date" className="form-control" />
                            </div>
                        </div>
                        <div className="form-group col-md-6">
                            <label>Start Time</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><span className="fe fe-clock fe-16"></span></div>
                                </div>
                                <input type="time" className="form-control" />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label>End Date</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><span className="fe fe-calendar fe-16"></span></div>
                                </div>
                                <input type="date" className="form-control" />
                            </div>
                        </div>
                        <div className="form-group col-md-6">
                            <label>End Time</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><span className="fe fe-clock fe-16"></span></div>
                                </div>
                                <input type="time" className="form-control" />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* --- EDIT APPOINTMENT SLIDE MODAL --- */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Appointment"
                isSlide={true}
                footer={
                    <>
                        <button type="button" className="btn btn-danger">Cancel Appointment</button>
                        <div>
                            <button type="button" className="btn btn-secondary mr-2" onClick={() => setIsEditModalOpen(false)}>Close</button>
                            <button type="button" className="btn btn-primary">Update Appointment</button>
                        </div>
                    </>
                }
            >
                {selectedEvent && (
                    <form>
                        <div className="form-group">
                            <label className="col-form-label">Customer Name</label>
                            <input type="text" className="form-control" value={selectedEvent.customerName || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label className="col-form-label">Service Category</label>
                            <input type="text" className="form-control" value={selectedEvent.serviceCategory || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label className="col-form-label">Service</label>
                            <input type="text" className="form-control" value={selectedEvent.service || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label className="col-form-label">Stylist</label>
                            <input type="text" className="form-control" value={selectedEvent.stylist || ''} readOnly />
                        </div>

                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label>Start Date</label>
                                <div className="input-group">
                                    <div className="input-group-prepend"><div className="input-group-text"><span className="fe fe-calendar fe-16"></span></div></div>
                                    <input type="date" className="form-control" value={selectedEvent.startDate || ''} readOnly />
                                </div>
                            </div>
                            <div className="form-group col-md-6">
                                <label>Start Time</label>
                                <div className="input-group">
                                    <div className="input-group-prepend"><div className="input-group-text"><span className="fe fe-clock fe-16"></span></div></div>
                                    <input type="time" className="form-control" value={selectedEvent.startTime || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label>End Date</label>
                                <div className="input-group">
                                    <div className="input-group-prepend"><div className="input-group-text"><span className="fe fe-calendar fe-16"></span></div></div>
                                    <input type="date" className="form-control" value={selectedEvent.endDate || ''} readOnly />
                                </div>
                            </div>
                            <div className="form-group col-md-6">
                                <label>End Time</label>
                                <div className="input-group">
                                    <div className="input-group-prepend"><div className="input-group-text"><span className="fe fe-clock fe-16"></span></div></div>
                                    <input type="time" className="form-control" value={selectedEvent.endTime || ''} readOnly />
                                </div>
                            </div>
                        </div>

                    </form>
                )}
            </Modal>

        </div>
    );
};