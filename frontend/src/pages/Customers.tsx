import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

// Map to our FastAPI Backend Schema
interface Customer {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
}

interface PaginationMeta {
    total_records: number;
    total_pages: number;
    current_page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
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
            // In a real app, you'd pass the search term to the backend here too
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

                    {/* HEADER CARD (Exactly as in prototype) */}
                    <div className="card shadow mb-4 border-0">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col">
                                    <h2 className="h3 mb-0 page-title">Customers</h2>
                                </div>
                                <div className="col-auto">
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
                                        onClick={() => navigate('/customers/new')}
                                    >
                                        <span className="fe fe-user-plus fe-12 mr-2"></span>Create Customer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <div className="card shadow mb-4 border-0">
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                </div>
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
                                                // Mocking visual assets to match prototype UI
                                                const avatarId = (customer.id % 8) + 1; // Cycles through face-1.jpg to face-8.jpg
                                                const mockVisits = (customer.id * 3) % 20;

                                                return (
                                                    <tr key={customer.id}>
                                                        <td>{customer.id}</td>

                                                        {/* Complex Customer Details Cell */}
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar avatar-sm mr-3">
                                                                    <img src={`/assets/avatars/face-${avatarId}.jpg`} alt="avatar" className="avatar-img rounded-circle" />
                                                                </div>
                                                                <div>
                                                                    <p className="mb-0 text-muted"><strong>{customer.full_name}</strong></p>
                                                                    <small className="mb-0 text-muted">
                                                                        @{customer.full_name.split(' ')[0].toLowerCase()}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Preferred Stylist (Mocked for now) */}
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div>
                                                                    <p className="mb-0 text-muted"><strong>Sanaa Ali Awan</strong></p>
                                                                    <small className="mb-0 text-muted">Senior Stylist</small>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Primary Contact */}
                                                        <td>
                                                            {customer.phone_number ? (
                                                                <><i className="fe fe-phone fe-16 mr-2"></i>{customer.phone_number}</>
                                                            ) : (
                                                                <><i className="fe fe-mail fe-16 mr-2"></i>{customer.email}</>
                                                            )}
                                                        </td>

                                                        {/* Media Consent & Status */}
                                                        <td>
                                                            {customer.is_active ? (
                                                                <span className="badge badge-pill badge-primary">Yes</span>
                                                            ) : (
                                                                <span className="badge badge-pill badge-secondary">No</span>
                                                            )}
                                                        </td>

                                                        {/* Visits */}
                                                        <td>{mockVisits}</td>

                                                        {/* Flagged (Just showing one condition based on visits for UI testing) */}
                                                        <td>
                                                            {mockVisits === 0 ? (
                                                                <span className="badge badge-pill badge-danger">No Appointments</span>
                                                            ) : null}
                                                        </td>

                                                        {/* Actions Dropdown */}
                                                        <td>
                                                            <div className="dropdown">
                                                                <button className="btn btn-sm dropdown-toggle more-vertical" type="button" data-toggle="dropdown">
                                                                    <span className="text-muted sr-only">Action</span>
                                                                </button>
                                                                <div className="dropdown-menu dropdown-menu-right">
                                                                    <a className="dropdown-item" href="#!">Edit</a>
                                                                    <a className="dropdown-item" href="#!">Service History</a>
                                                                    <a className="dropdown-item" href="#!">Appointments</a>
                                                                    <a className="dropdown-item" href="#!">Gallery</a>
                                                                </div>
                                                            </div>
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

                    {/* PAGINATION (Exactly matching prototype) */}
                    {meta && meta.total_pages > 1 && (
                        <nav aria-label="Table Paging" className="my-3">
                            <ul className="pagination justify-content-end mb-0">
                                <li className={`page-item ${!meta.has_prev ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => fetchCustomers((meta.current_page - 2) * meta.limit, meta.limit)}
                                    >
                                        Previous
                                    </button>
                                </li>

                                {/* Dynamically build page numbers */}
                                {[...Array(meta.total_pages)].map((_, i) => (
                                    <li key={i} className={`page-item ${meta.current_page === i + 1 ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => fetchCustomers(i * meta.limit, meta.limit)}
                                        >
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}

                                <li className={`page-item ${!meta.has_next ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => fetchCustomers(meta.current_page * meta.limit, meta.limit)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}

                </div>
            </div>
        </div>
    );
};