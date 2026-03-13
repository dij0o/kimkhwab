import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

import { PageHeader } from '../components/PageHeader';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { Dropdown } from '../components/Dropdown';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

interface Customer {
    id: number;
    full_name: string;
    profile_image_url?: string | null;
    phone_number: string;
    email: string | null;
    media_consent: boolean;
    visit_count: number;
    is_active: boolean;
    preferred_employee?: { full_name: string; designation?: string | null } | null;
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

    useEffect(() => { fetchCustomers(0, 10); }, []);

    return (
        <div className="container-fluid">
            <PageHeader title="Customers">
                <div className="input-group mr-2 d-inline-flex w-auto">
                    <input type="text" className="form-control" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button"><span className="fe fe-search fe-12"></span></button>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/customers/create')}>
                    <span className="fe fe-user-plus fe-12 mr-2"></span>Create Customer
                </button>
            </PageHeader>

            <Card>
                {loading ? (
                    <Spinner text="Loading customers..." />
                ) : customers.length === 0 ? (
                    <EmptyState icon="fe-users" title="No Customers Found" description="Try adjusting your search or create a new customer." />
                ) : (
                    <table className="table table-borderless table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer Details</th>
                                <th>Preferred Stylist</th>
                                <th>Primary Contact</th>
                                <th>Media Consent</th>
                                <th>Visits</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Avatar src={customer.profile_image_url} size="sm" className="mr-3" />
                                            <div>
                                                <p className="mb-0 text-muted"><strong>{customer.full_name}</strong></p>
                                                <small className="mb-0 text-muted">@{customer.full_name.split(' ')[0].toLowerCase()}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="mb-0 text-muted">
                                            <strong>{customer.preferred_employee?.full_name || 'Unassigned'}</strong>
                                        </p>
                                        <small className="mb-0 text-muted">{customer.preferred_employee?.designation || (customer.preferred_employee ? 'Staff' : 'No Preference')}</small>
                                    </td>
                                    <td>{customer.phone_number}</td>
                                    <td>
                                        {customer.media_consent ? (
                                            <span className="badge badge-pill badge-primary">Yes</span>
                                        ) : (
                                            <span className="badge badge-pill badge-secondary">No</span>
                                        )}
                                    </td>
                                    <td>{customer.visit_count}</td>
                                    <td>
                                        <Dropdown>
                                            <Link className="dropdown-item" to={`/customers/${customer.id}`}><i className="fe fe-user mr-2"></i> View Profile</Link>
                                            <Link className="dropdown-item" to={`/customers/${customer.id}/edit`}><i className="fe fe-edit mr-2"></i> Edit</Link>
                                            <Link className="dropdown-item" to={`/customers/${customer.id}/history`}><i className="fe fe-clock mr-2"></i> Service History</Link>
                                            <Link className="dropdown-item" to={`/customers/${customer.id}/appointments`}><i className="fe fe-calendar mr-2"></i> Appointments</Link>
                                            <Link className="dropdown-item" to={`/gallery?customerId=${customer.id}`}><i className="fe fe-image mr-2"></i> Gallery</Link>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Pagination meta={meta} onPageChange={fetchCustomers} />
        </div>
    );
};