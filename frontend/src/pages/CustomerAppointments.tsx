import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

interface Appointment {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
    employee: { full_name: string };
    category: { name: string };
}

export const CustomerAppointments: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState('Customer');

    useEffect(() => {
        const fetchAppointmentsAndCustomer = async () => {
            try {
                const [custRes, apptRes] = await Promise.all([
                    apiClient.get(`/customers/${id}`),
                    apiClient.get(`/appointments/?customer_id=${id}`)
                ]);
                setCustomerName(custRes.data.data.full_name);
                setAppointments(apptRes.data.data);
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointmentsAndCustomer();
    }, [id]);

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'badge-success';
            case 'cancelled': return 'badge-danger';
            case 'no_show': return 'badge-warning';
            default: return 'badge-primary'; // booked
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title={`${customerName}'s Appointments`}>
                <button className="btn btn-secondary" onClick={() => navigate(`/customers/${id}`)}>
                    <i className="fe fe-arrow-left mr-2"></i>Back to Profile
                </button>
            </PageHeader>

            <Card className="mb-4">
                {loading ? (
                    <Spinner text="Loading appointments..." />
                ) : appointments.length === 0 ? (
                    <EmptyState icon="fe-calendar" title="No Appointments Found" description="This customer has not booked any appointments yet." />
                ) : (
                    <table className="table table-hover table-borderless">
                        <thead className="thead-light">
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Service Category</th>
                                <th>Stylist</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((appt) => {
                                const dateObj = new Date(appt.start_time);
                                const endDateObj = new Date(appt.end_time);
                                return (
                                    <tr key={appt.id}>
                                        <td>#{appt.id}</td>
                                        <td><strong>{dateObj.toLocaleDateString()}</strong></td>
                                        <td>
                                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td>{appt.category?.name || 'Unknown'}</td>
                                        <td>{appt.employee?.full_name || 'Unknown'}</td>
                                        <td>
                                            <span className={`badge badge-pill ${getStatusBadge(appt.status)}`}>
                                                {appt.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};