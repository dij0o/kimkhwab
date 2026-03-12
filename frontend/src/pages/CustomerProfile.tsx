import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';

interface CustomerProfileData {
    id: number;
    full_name: string;
    phone_number: string;
    whatsapp_number: string | null;
    email: string | null;
    instagram_handle: string | null;
    is_active: boolean;
    media_consent: boolean;
    visit_count: number;
    profile_image_url?: string | null;
    profile?: {
        notes: string | null;
        preferences: string | null;
    };
}

export const CustomerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (id === 'new') {
            navigate('/customers/new', { replace: true });
        }
    }, [id, navigate]);

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await apiClient.get(`/customers/${id}`);
                setCustomer(response.data.data);
            } catch (err: any) {
                setError('Failed to load customer profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    if (loading) return <div className="mt-5"><Spinner text="Loading profile..." /></div>;
    if (error || !customer) return <div className="alert alert-danger m-4">{error || 'Customer not found'}</div>;

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title="Customer Profile">
                        <button className="btn btn-secondary mr-2" onClick={() => navigate('/customers')}>
                            <i className="fe fe-arrow-left mr-2"></i>Back to List
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(`/customers/${id}/edit`)}>
                            <i className="fe fe-edit mr-2"></i>Edit Customer
                        </button>
                    </PageHeader>

                    <div className="row mt-4">
                        {/* Left Column: Avatar & Contact */}
                        <div className="col-md-4 mb-4">
                            <div className="card shadow border-0 text-center h-100">
                                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                                    <div className="avatar avatar-xl mb-4">
                                        <img
                                            src={customer.profile_image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${customer.profile_image_url}` : '/assets/avatars/placeholder.svg'}
                                            alt="Profile"
                                            className="avatar-img rounded-circle border shadow-sm"
                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <h3 className="h4 mb-1">{customer.full_name}</h3>
                                    {customer.instagram_handle && <p className="text-muted mb-2">@{customer.instagram_handle}</p>}
                                    <div className="badge badge-pill badge-light border px-3 py-2 mb-3 mt-2">
                                        <i className="fe fe-star text-primary mr-2"></i><strong>{customer.visit_count}</strong> Visits
                                    </div>

                                    <div className="mt-3 w-100 text-left">
                                        <hr />
                                        <p className="mb-2"><i className="fe fe-phone mr-3 text-muted"></i>{customer.phone_number}</p>
                                        {customer.whatsapp_number && <p className="mb-2"><i className="fe fe-message-circle mr-3 text-muted"></i>{customer.whatsapp_number}</p>}
                                        {customer.email && <p className="mb-2"><i className="fe fe-mail mr-3 text-muted"></i>{customer.email}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="col-md-8 mb-4">
                            <div className="card shadow border-0 h-100">
                                <div className="card-header">
                                    <strong>Bio & Preferences</strong>
                                </div>
                                <div className="card-body">
                                    <p><strong>Notes / Allergies:</strong></p>
                                    <p className="text-muted bg-light p-3 rounded" style={{ minHeight: '100px' }}>
                                        {customer.profile?.notes || 'No notes available.'}
                                    </p>

                                    <div className="row mt-4">
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Preferences:</strong></p>
                                            <p className="text-muted">{customer.profile?.preferences || 'None specified'}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-1"><strong>Media Consent:</strong></p>
                                            {customer.media_consent ? (
                                                <span className="badge badge-pill badge-primary">Yes</span>
                                            ) : (
                                                <span className="badge badge-pill badge-secondary">No</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New Row: Action Cards Grid (Uniform Primary Colors) */}
                    <div className="row">
                        <div className="col-md-4 mb-4">
                            <Link to={`/customers/${id}/appointments`} style={{ textDecoration: 'none' }}>
                                <div className="card shadow-sm border-0 bg-primary text-white text-center h-100 p-4" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <i className="fe fe-calendar fe-32 mb-3"></i>
                                    <h5 className="text-white mb-0">Appointments</h5>
                                </div>
                            </Link>
                        </div>
                        <div className="col-md-4 mb-4">
                            <Link to={`/customers/${id}/history`} style={{ textDecoration: 'none' }}>
                                <div className="card shadow-sm border-0 bg-primary text-white text-center h-100 p-4" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <i className="fe fe-clock fe-32 mb-3"></i>
                                    <h5 className="text-white mb-0">Service History</h5>
                                </div>
                            </Link>
                        </div>
                        <div className="col-md-4 mb-4">
                            <Link to={`/gallery?customerId=${id}`} style={{ textDecoration: 'none' }}>
                                <div className="card shadow-sm border-0 bg-primary text-white text-center h-100 p-4" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <i className="fe fe-image fe-32 mb-3"></i>
                                    <h5 className="text-white mb-0">Gallery</h5>
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};