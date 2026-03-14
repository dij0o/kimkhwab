import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

import { PageHeader } from '../components/PageHeader';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { TableCard } from '../components/TableCard';
import { useFeedback } from '../feedback/FeedbackProvider';

interface Employee {
    id: number;
    full_name: string;
    designation: string | null;
    mobile_number: string | null;
    specialties: string | null;
    is_active: boolean;
    profile_image_path: string | null;
    employee_type?: { name: string };
}

export const Employees: React.FC = () => {
    const navigate = useNavigate();
    const { notify, confirm } = useFeedback();
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

    useEffect(() => { fetchEmployees(0, 10); }, []);

    const handleDeactivate = async (id: number) => {
        const shouldDeactivate = await confirm({
            title: 'Deactivate Employee',
            message: 'Are you sure you want to deactivate this employee?',
            confirmLabel: 'Deactivate Employee',
            confirmTone: 'danger'
        });

        if (!shouldDeactivate) {
            return;
        }

        try {
            await apiClient.delete(`/employees/${id}`);
            notify({ title: 'Employee Deactivated', message: 'The employee has been deactivated.', type: 'success' });
            fetchEmployees(meta ? (meta.current_page - 1) * meta.limit : 0, 10);
        } catch (err) {
            notify({ title: 'Action Failed', message: 'Failed to deactivate employee.', type: 'danger' });
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Employees">
                <div className="input-group mr-2 d-inline-flex w-auto">
                    <input type="text" className="form-control" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button"><span className="fe fe-search fe-12"></span></button>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/employees/create')}>
                    <span className="fe fe-user-plus fe-12 mr-2"></span>Add Employee
                </button>
            </PageHeader>

            <TableCard
                loading={loading}
                loadingText="Loading employees..."
                isEmpty={employees.length === 0}
                emptyState={<EmptyState icon="fe-users" title="No Employees Found" description="Try adjusting your search or add a new staff member." />}
            >
                <table className="table table-borderless table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Type</th>
                            <th>Designation</th>
                            <th>Mobile Number</th>
                            <th>Specialties</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => {
                            const isPermanent = employee.employee_type?.name?.toLowerCase() === 'permanent';

                            return (
                                <tr key={employee.id}>
                                    <td>{employee.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Avatar src={employee.profile_image_path} size="sm" className="mr-3" />
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
                                    <td><span className="text-muted">{employee.designation || '-'}</span></td>
                                    <td>{employee.mobile_number || '-'}</td>
                                    <td><span className="text-muted">{employee.specialties || '-'}</span></td>
                                    <td>
                                        <span className={`badge badge-pill ${employee.is_active ? 'badge-primary' : 'badge-secondary'}`}>
                                            {employee.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <Dropdown>
                                            <Link className="dropdown-item" to={`/employees/${employee.id}`}><i className="fe fe-eye mr-2"></i> View Details</Link>
                                            <Link className="dropdown-item" to={`/employees/${employee.id}/edit`}><i className="fe fe-edit mr-2"></i> Edit</Link>
                                            {employee.is_active && (
                                                <button className="dropdown-item text-danger" onClick={() => handleDeactivate(employee.id)}>
                                                    <i className="fe fe-user-x mr-2"></i> Deactivate
                                                </button>
                                            )}
                                        </Dropdown>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </TableCard>

            <Pagination meta={meta} onPageChange={fetchEmployees} />
        </div>
    );
};
