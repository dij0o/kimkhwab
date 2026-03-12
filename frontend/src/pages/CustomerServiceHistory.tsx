import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';

interface CustomerProfileData {
    id: number;
    full_name: string;
    created_at: string;
    profile_image_url?: string | null;
    media_consent: boolean;
    profile?: { notes: string | null; preferences: string | null; };
}

interface ServiceHistoryItem {
    id: number;
    service_name: string;
    price: number;
    performed_on: string;
    notes: string | null;
    employee: { full_name: string } | null;
}

export const CustomerServiceHistory: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
    const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, histRes] = await Promise.all([
                    apiClient.get(`/customers/${id}`),
                    apiClient.get(`/customers/${id}/history`)
                ]);
                setCustomer(custRes.data.data);
                setHistory(histRes.data.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Group history by Month/Year for the Timeline
    const groupHistory = (items: ServiceHistoryItem[]) => {
        const groups: { [key: string]: ServiceHistoryItem[] } = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        items.forEach(item => {
            const d = new Date(item.performed_on);
            const month = d.getMonth();
            const year = d.getFullYear();

            let label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

            if (year === currentYear && month === currentMonth) {
                label = "This Month";
            } else if (year === currentYear && month === currentMonth - 1 || (currentMonth === 0 && month === 11 && year === currentYear - 1)) {
                label = "Last Month";
            }

            if (!groups[label]) groups[label] = [];
            groups[label].push(item);
        });
        return groups;
    };

    const groupedHistory = groupHistory(history);
    const timelineColors = ['item-success', 'item-primary', 'item-warning', 'item-info', 'item-danger'];
    let colorIndex = 0;

    if (loading) return <div className="mt-5"><Spinner text="Loading service history..." /></div>;

    const lastVisit = history.length > 0 ? new Date(history[0].performed_on).toLocaleDateString('en-GB') : 'No visits yet';

    return (
        <div className="container-fluid">
            <PageHeader title="Service History" />

            {/* Customer Profile Card */}
            <div className="card shadow mb-4 border-0">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <div className="avatar avatar-lg mr-4">
                                <img
                                    src={customer?.profile_image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${customer?.profile_image_url}` : '/assets/avatars/placeholder.svg'}
                                    alt="Customer Avatar"
                                    className="avatar-img rounded-circle border shadow-sm"
                                    style={{ width: '80px', height: '80px', minWidth: '80px', objectFit: 'cover' }}
                                />
                            </div>
                            <div>
                                <h4 className="mb-1">{customer?.full_name}</h4>
                                <p className="mb-0 text-muted">Customer ID: #{customer?.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <small className="text-muted">Joining Date</small>
                                <p className="mb-0 font-weight-bold">{customer ? new Date(customer.created_at).toLocaleDateString('en-GB') : '-'}</p>
                            </div>
                            <div>
                                <small className="text-muted">Last Visit</small>
                                <p className="mb-0 font-weight-bold">{lastVisit}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Cards Row */}
            <div className="row" style={{ minHeight: 'calc(100vh - 450px)' }}>

                {/* TIMELINE */}
                <div className="col-md-8 d-flex mb-4">
                    <div className="card shadow border-0 timeline flex-fill">
                        <div className="card-body" style={{ overflowY: 'auto' }}>
                            {Object.keys(groupedHistory).length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="fe fe-clock fe-32 mb-3"></i>
                                    <h5>No Service History</h5>
                                    <p>When an appointment is completed and invoiced, it will appear here.</p>
                                </div>
                            ) : (
                                Object.keys(groupedHistory).map(groupLabel => (
                                    <React.Fragment key={groupLabel}>
                                        <h6 className="text-uppercase text-muted mb-4 mt-2">{groupLabel}</h6>
                                        {groupedHistory[groupLabel].map((item) => {
                                            const colorClass = timelineColors[colorIndex % timelineColors.length];
                                            colorIndex++;

                                            return (
                                                <div key={item.id} className={`pb-3 timeline-item ${colorClass}`}>
                                                    <div className="pl-5">
                                                        <div className="mb-1">
                                                            <strong>{item.service_name}</strong>
                                                            <span className="text-muted small mx-2">- Rs {item.price.toLocaleString()}</span>
                                                        </div>
                                                        <p className="small text-muted">
                                                            Stylist: {item.employee?.full_name || 'Unknown'}
                                                            <span className="badge badge-light ml-2">
                                                                {new Date(item.performed_on).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </p>
                                                        {item.notes && (
                                                            <div className="card d-inline-flex mb-2">
                                                                <div className="card-body bg-light py-2 px-3 text-muted">
                                                                    {item.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Notes */}
                <div className="col-md-4 d-flex mb-4">
                    <div className="card shadow border-0 flex-fill">
                        <div className="card-header">
                            <strong>Additional Notes</strong>
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <small className="text-muted text-uppercase font-weight-bold">Bio Information</small>
                                <p className="mb-0 mt-2 p-3 bg-light rounded text-muted">{customer?.profile?.notes || 'No bio information provided.'}</p>
                            </div>
                            <div className="custom-control custom-checkbox mt-2">
                                <input type="checkbox" className="custom-control-input" id="mediaConsentDisplay" checked={customer?.media_consent || false} readOnly />
                                <label className="custom-control-label" htmlFor="mediaConsentDisplay">
                                    Media consent {customer?.media_consent ? 'granted' : 'denied'}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <div className="row mt-2 mb-5">
                <div className="col-12 text-right">
                    <button className="btn btn-secondary" onClick={() => navigate(`/customers/${id}`)}>
                        <i className="fe fe-arrow-left mr-2"></i>Back to Profile
                    </button>
                </div>
            </div>

        </div>
    );
};