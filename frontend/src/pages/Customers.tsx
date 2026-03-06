import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

// 1. Define the TypeScript interfaces based on our FastAPI Schemas
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
    // 2. Setup React State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // 3. Fetch Data Function (with pagination support)
    const fetchCustomers = async (skip: number = 0, limit: number = 10) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/customers/?skip=${skip}&limit=${limit}`);
            // Because we used the JSend standard, we always know where 'data' and 'meta' are!
            setCustomers(response.data.data);
            setMeta(response.data.meta);
            setError('');
        } catch (err: any) {
            setError('Failed to load customers. Please check your connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 4. Run on component mount
    useEffect(() => {
        fetchCustomers(0, 10);
    }, []);

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    {/* Header Row */}
                    <div className="row align-items-center mb-2">
                        <div className="col">
                            <h2 className="h5 page-title">Customers</h2>
                            <p className="mb-3">Manage your salon's client base, view history, and book appointments.</p>
                        </div>
                        <div className="col-auto">
                            <button className="btn btn-primary" onClick={() => alert('Add Customer Modal Coming Soon!')}>
                                <i className="fe fe-plus fe-16 mr-2"></i> Add Customer
                            </button>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* Data Table Card */}
                    <div className="card shadow border-0">
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-borderless table-hover mb-0">
                                        <thead className="thead-dark">
                                            <tr>
                                                <th>ID</th>
                                                <th>Full Name</th>
                                                <th>Phone Number</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center text-muted py-4">
                                                        No customers found. Click "Add Customer" to get started.
                                                    </td>
                                                </tr>
                                            ) : (
                                                customers.map((customer) => (
                                                    <tr key={customer.id}>
                                                        <td><span className="text-muted">#{customer.id}</span></td>
                                                        <td><strong>{customer.full_name}</strong></td>
                                                        <td>{customer.phone_number || 'N/A'}</td>
                                                        <td>{customer.email || 'N/A'}</td>
                                                        <td>
                                                            {customer.is_active ? (
                                                                <span className="badge badge-success">Active</span>
                                                            ) : (
                                                                <span className="badge badge-danger">Inactive</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="dropdown">
                                                                <button className="btn btn-sm dropdown-toggle more-vertical" type="button" data-toggle="dropdown">
                                                                    <span className="text-muted sr-only">Action</span>
                                                                </button>
                                                                <div className="dropdown-menu dropdown-menu-right">
                                                                    <a className="dropdown-item" href="#!">Edit Profile</a>
                                                                    <a className="dropdown-item" href="#!">Book Appointment</a>
                                                                    <a className="dropdown-item" href="#!">View Gallery</a>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination Controls */}
                                    {meta && meta.total_pages > 1 && (
                                        <nav className="mt-4">
                                            <ul className="pagination justify-content-center">
                                                <li className={`page-item ${!meta.has_prev ? 'disabled' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => fetchCustomers((meta.current_page - 2) * meta.limit, meta.limit)}
                                                    >
                                                        Previous
                                                    </button>
                                                </li>
                                                <li className="page-item active"><span className="page-link">{meta.current_page} of {meta.total_pages}</span></li>
                                                <li className={`page-item ${!meta.has_next ? 'disabled' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => fetchCustomers((meta.current_page) * meta.limit, meta.limit)}
                                                    >
                                                        Next
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};