import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

// Reusable Components
import { PageHeader } from '../components/PageHeader';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { Dropdown } from '../components/Dropdown';

// Interface matching EmployeeResponse from backend
interface Employee {
    id: number;
    full_name: string;
    designation: string | null;
    mobile_number: string | null;
    specialties: string | null;
    is_active: boolean;
    profile_image_path: string | null;
    employee_type?: { name: string };
    role?: { name: string };
}

export const Employees: React.FC = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');

    const fetchEmployees = async (skip: number = 0, limit: number = 10) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/employees/?skip=${skip}&limit=${limit}`);
            setEmployees(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error('Failed to fetch employees', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees(0, 10);
    }, []);

    const handleDeactivate = async (id: number) => {
        if (window.confirm("Are you sure you want to deactivate this employee?")) {
            try {
                await apiClient.delete(`/employees/${id}`);
                fetchEmployees(meta ? (meta.current_page - 1) * meta.limit : 0, 10);
            } catch (err) {
                alert("Failed to deactivate employee.");
            }
        }
    };

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title="Employees">
                        <div className="input-group mr-2 d-inline-flex w-auto">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search employees..."
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
                            onClick={() => navigate('/employees/create')}
                        >
                            <span className="fe fe-user-plus fe-12 mr-2"></span>Add Employee
                        </button>
                    </PageHeader>

                    <div className="card shadow mb-4 border-0">
                        <div className="card-body">
                            {loading ? (
                                <Spinner text="Loading employees..." />
                            ) : (
                                <table className="table table-borderless table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Full Name</th>
                                            <th>Type</th>
                                            <th>Designation</th>
                                            <th>Mobile Number</th>
                                            <th>Status</th>
                                            <th>Application Role</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted">No employees found.</td>
                                            </tr>
                                        ) : (
                                            employees.map((employee) => {
                                                const avatarUrl = employee.profile_image_path
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${employee.profile_image_path}`
                                                    : '/assets/avatars/placeholder.svg'; // Standard blank placeholder

                                                const isPermanent = employee.employee_type?.name?.toLowerCase() === 'permanent';

                                                return (
                                                    <tr key={employee.id}>
                                                        <td>{employee.id}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar avatar-sm mr-3">
                                                                    <img src={avatarUrl} alt="avatar" className="avatar-img rounded-circle" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                                                </div>
                                                                <div>
                                                                    <p className="mb-0 text-muted"><strong>{employee.full_name}</strong></p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-pill ${isPermanent ? 'badge-primary' : 'badge-secondary'}`}>
                                                                {employee.employee_type?.name || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {/* Changed this to display the new Designation instead of the System Role */}
                                                            <span className="text-muted">{employee.designation || '-'}</span>
                                                        </td>
                                                        <td>{employee.mobile_number || '-'}</td>
                                                        <td>
                                                            <span className={`badge badge-pill ${employee.is_active ? 'badge-primary' : 'badge-secondary'}`}>
                                                                {employee.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">{employee.role?.name || 'Unassigned'}</span>
                                                        </td>
                                                        <td>
                                                            <Dropdown>
                                                                <Link className="dropdown-item" to={`/employees/${employee.id}`}>
                                                                    <i className="fe fe-eye mr-2"></i> View Details
                                                                </Link>
                                                                <Link className="dropdown-item" to={`/employees/${employee.id}/edit`}>
                                                                    <i className="fe fe-edit mr-2"></i> Edit
                                                                </Link>
                                                                {employee.is_active && (
                                                                    <button className="dropdown-item text-danger" onClick={() => handleDeactivate(employee.id)}>
                                                                        <i className="fe fe-user-x mr-2"></i> Deactivate
                                                                    </button>
                                                                )}
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

                    <Pagination meta={meta} onPageChange={fetchEmployees} />

                </div>
            </div>
        </div>
    );
};