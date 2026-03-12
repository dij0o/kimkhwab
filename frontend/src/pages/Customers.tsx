import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

// Import our new Reusable Components
import { PageHeader } from '../components/PageHeader';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Spinner } from '../components/Spinner';

import { Dropdown } from '../components/Dropdown';

// Map to our FastAPI Backend Schema
interface Customer {
    id: number;
    full_name: string;
    profile_image_url?: string | null;
    phone_number: string;
    email: string | null;
    media_consent: boolean;
    visit_count: number;
    is_active: boolean;
    created_at: string;
}

export const Customers: React.FC = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');

    const fetchCustomers = async (skip: number = 0, limit: number = 10) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/customers/?skip=${skip}&limit=${limit}`);
            setCustomers(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers(0, 10);
    }, []);

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    {/* 1. REUSABLE PAGE HEADER */}
                    <PageHeader title="Customers">
                        {/* Anything placed inside here automatically aligns to the right! */}
                        <div className="input-group mr-2 d-inline-flex w-auto">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search customers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="input-group-append">
                                <button className="btn btn-primary" type="button">
                                    <span className="fe fe-search fe-12"></span>
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate('/customers/create')}
                        >
                            <span className="fe fe-user-plus fe-12 mr-2"></span>Create Customer
                        </button>
                    </PageHeader>

                    {/* TABLE CARD */}
                    <div className="card shadow mb-4 border-0">
                        <div className="card-body">
                            {loading ? (
                                // 2. REUSABLE SPINNER
                                <Spinner text="Loading customers..." />
                            ) : (
                                <table className="table table-borderless table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer Details</th>
                                            <th>Preferred Stylist</th>
                                            <th>Primary Contact</th>
                                            <th>Media Consent</th>
                                            <th>Number of Visits</th>
                                            <th>Flagged</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted">
                                                    No customers found.
                                                </td>
                                            </tr>
                                        ) : (
                                            customers.map((customer) => {
                                                const avatarUrl = customer.profile_image_url
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${customer.profile_image_url}`
                                                    : '/assets/avatars/placeholder.svg';

                                                return (
                                                    <tr key={customer.id}>
                                                        {/* 1. ID */}
                                                        <td>{customer.id}</td>

                                                        {/* 2. Customer Details */}
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar avatar-sm mr-3">
                                                                    <img src={avatarUrl} alt="avatar" className="avatar-img rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                                                </div>
                                                                <div>
                                                                    <p className="mb-0 text-muted"><strong>{customer.full_name}</strong></p>
                                                                    <small className="mb-0 text-muted">
                                                                        @{customer.full_name.split(' ')[0].toLowerCase()}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 3. Preferred Stylist */}
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div>
                                                                    <p className="mb-0 text-muted"><strong>Sanaa Ali Awan</strong></p>
                                                                    <small className="mb-0 text-muted">Senior Stylist</small>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 4. Primary Contact */}
                                                        <td>{customer.phone_number}</td>

                                                        {/* 5. Media Consent */}
                                                        <td>
                                                            {customer.media_consent ? (
                                                                <span className="badge badge-pill badge-primary">Yes</span>
                                                            ) : (
                                                                <span className="badge badge-pill badge-secondary">No</span>
                                                            )}
                                                        </td>

                                                        {/* 6. Number of Visits */}
                                                        <td>{customer.visit_count}</td>

                                                        {/* 7. Flagged */}
                                                        <td>
                                                            <span className="text-muted">-</span>
                                                        </td>

                                                        {/* 8. Actions */}
                                                        <td>
                                                            <Dropdown>
                                                                <Link className="dropdown-item" to={`/customers/${customer.id}`}>
                                                                    <i className="fe fe-user mr-2"></i> View Profile
                                                                </Link>
                                                                <Link className="dropdown-item" to={`/customers/${customer.id}/edit`}>
                                                                    <i className="fe fe-edit mr-2"></i> Edit
                                                                </Link>
                                                                <Link className="dropdown-item" to={`/customers/${customer.id}/history`}>
                                                                    <i className="fe fe-clock mr-2"></i> Service History
                                                                </Link>
                                                                <Link className="dropdown-item" to={`/customers/${customer.id}/appointments`}>
                                                                    <i className="fe fe-calendar mr-2"></i> Appointments
                                                                </Link>
                                                                <Link className="dropdown-item" to={`/gallery?customerId=${customer.id}`}>
                                                                    <i className="fe fe-image mr-2"></i> Gallery
                                                                </Link>
                                                            </Dropdown>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* 3. REUSABLE PAGINATION */}
                    <Pagination
                        meta={meta}
                        onPageChange={fetchCustomers}
                    />

                </div>
            </div>
        </div>
    );
};