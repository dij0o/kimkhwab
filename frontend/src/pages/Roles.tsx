import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { Dropdown } from '../components/Dropdown';
import { EmptyState } from '../components/EmptyState';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { TableCard } from '../components/TableCard';
import { useFeedback } from '../feedback/FeedbackProvider';

type RoleStatus = 'active' | 'inactive';

type PermissionDefinition = {
    id: string;
    label: string;
    description: string;
};

type PermissionModule = {
    title: string;
    accentClass: string;
    permissions: PermissionDefinition[];
};

type RoleRecord = {
    id: number;
    name: string;
    description: string;
    permissions: string[];
    user_count: number;
    status: RoleStatus;
};

type RoleFormData = {
    name: string;
    description: string;
    permissions: string[];
};

const ROLE_PAGE_SIZE = 5;

const PERMISSION_MODULES: PermissionModule[] = [
    {
        title: 'Customer Management',
        accentClass: 'text-primary',
        permissions: [
            { id: 'view_customers', label: 'View Customers', description: 'View customer information and profiles.' },
            { id: 'add_customers', label: 'Create Customers', description: 'Create new customer records.' },
            { id: 'edit_customers', label: 'Edit Customers', description: 'Modify existing customer information.' },
            { id: 'delete_customers', label: 'Delete Customers', description: 'Remove customer records from the system.' },
            { id: 'view_appointments', label: 'View Appointments', description: 'View appointment schedules and details.' },
            { id: 'add_appointments', label: 'Create Appointments', description: 'Book new appointments for customers.' },
            { id: 'edit_appointments', label: 'Edit Appointments', description: 'Adjust appointment timing and details.' },
            { id: 'cancel_appointments', label: 'Cancel Appointments', description: 'Cancel or mark appointments as unavailable.' }
        ]
    },
    {
        title: 'Service Management',
        accentClass: 'text-success',
        permissions: [
            { id: 'view_services', label: 'View Services', description: 'View available services and pricing.' },
            { id: 'add_services', label: 'Create Services', description: 'Add new services to the system.' },
            { id: 'edit_services', label: 'Edit Services', description: 'Modify existing service information.' },
            { id: 'delete_services', label: 'Delete Services', description: 'Remove services from the catalog.' }
        ]
    },
    {
        title: 'Financial Management',
        accentClass: 'text-warning',
        permissions: [
            { id: 'view_ledger', label: 'View Ledger', description: 'View financial ledger and transactions.' },
            { id: 'create_invoices', label: 'Create Invoices', description: 'Generate invoices for customers.' },
            { id: 'view_invoices', label: 'View Invoices', description: 'Review invoice history and details.' },
            { id: 'view_payslips', label: 'View Payslips', description: 'Access employee payslip records.' }
        ]
    },
    {
        title: 'Staff Management',
        accentClass: 'text-info',
        permissions: [
            { id: 'view_employees', label: 'View Employees', description: 'View employee information and profiles.' },
            { id: 'add_employees', label: 'Create Employees', description: 'Add new employees to the system.' },
            { id: 'edit_employees', label: 'Edit Employees', description: 'Modify employee information.' },
            { id: 'manage_roles', label: 'Manage Roles & Permissions', description: 'Manage roles and permission assignments.' }
        ]
    },
    {
        title: 'System & Reports',
        accentClass: 'text-danger',
        permissions: [
            { id: 'view_dashboard', label: 'View Dashboard', description: 'Access dashboard metrics and summary cards.' },
            { id: 'view_reports', label: 'View Reports', description: 'Access system reports and analytics.' },
            { id: 'manage_gallery', label: 'Manage Gallery', description: 'Upload and curate the salon gallery.' }
        ]
    }
];

const EMPTY_FORM_DATA: RoleFormData = {
    name: '',
    description: '',
    permissions: []
};

const PERMISSION_LOOKUP = PERMISSION_MODULES.reduce<Record<string, PermissionDefinition>>((lookup, module) => {
    for (const permission of module.permissions) {
        lookup[permission.id] = permission;
    }
    return lookup;
}, {});

const prettifyPermissionId = (permissionId: string): string =>
    permissionId
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const getPermissionDefinition = (permissionId: string): PermissionDefinition =>
    PERMISSION_LOOKUP[permissionId] ?? {
        id: permissionId,
        label: prettifyPermissionId(permissionId),
        description: 'Custom permission code from the backend.'
    };

const splitPermissionsIntoColumns = (permissions: PermissionDefinition[]): [PermissionDefinition[], PermissionDefinition[]] => {
    const midpoint = Math.ceil(permissions.length / 2);
    return [permissions.slice(0, midpoint), permissions.slice(midpoint)];
};

const normalizeRole = (role: Record<string, unknown>): RoleRecord => ({
    id: Number(role.id ?? 0),
    name: String(role.name ?? ''),
    description: String(role.description ?? ''),
    permissions: Array.isArray(role.permissions) ? role.permissions.map((permission) => String(permission)) : [],
    user_count: Number(role.user_count ?? 0),
    status: role.status === 'inactive' ? 'inactive' : 'active'
});

const getStatusLabel = (status: RoleStatus): string => status.charAt(0).toUpperCase() + status.slice(1);

const getStatusBadgeClass = (status: RoleStatus): string =>
    status === 'inactive' ? 'badge badge-pill badge-secondary' : 'badge badge-pill badge-primary';

export const Roles: React.FC = () => {
    const { confirm } = useFeedback();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'danger' } | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);
    const [viewRole, setViewRole] = useState<RoleRecord | null>(null);
    const [formData, setFormData] = useState<RoleFormData>(EMPTY_FORM_DATA);

    useEffect(() => {
        void fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/roles/');
            const nextRoles = Array.isArray(response.data.data)
                ? response.data.data.map((role: Record<string, unknown>) => normalizeRole(role))
                : [];
            setRoles(nextRoles);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            if (roles.length === 0) {
                setRoles([
                    normalizeRole({
                        id: 1,
                        name: 'Administrator',
                        description: 'Full system access with all permissions.',
                        permissions: ['view_customers', 'add_customers', 'manage_roles', 'view_reports'],
                        user_count: 2,
                        status: 'active'
                    }),
                    normalizeRole({
                        id: 2,
                        name: 'Manager',
                        description: 'Management level access for daily operations.',
                        permissions: ['view_customers', 'add_customers', 'view_appointments', 'view_reports'],
                        user_count: 3,
                        status: 'active'
                    }),
                    normalizeRole({
                        id: 3,
                        name: 'Stylist',
                        description: 'Basic access for service providers.',
                        permissions: ['view_appointments', 'view_services', 'manage_gallery'],
                        user_count: 5,
                        status: 'active'
                    }),
                    normalizeRole({
                        id: 4,
                        name: 'Receptionist',
                        description: 'Front desk and customer service access.',
                        permissions: ['view_customers', 'view_appointments', 'create_invoices'],
                        user_count: 2,
                        status: 'active'
                    }),
                    normalizeRole({
                        id: 5,
                        name: 'Intern',
                        description: 'Limited access for training purposes.',
                        permissions: ['view_customers', 'view_services'],
                        user_count: 1,
                        status: 'inactive'
                    })
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const showToast = (title: string, message: string, type: 'success' | 'danger') => {
        setToast({ title, message, type });
        window.setTimeout(() => setToast(null), 3000);
    };

    const filteredRoles = roles.filter((role) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return (
            role.name.toLowerCase().includes(query) ||
            role.description.toLowerCase().includes(query) ||
            String(role.id).includes(query)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ROLE_PAGE_SIZE));
    const activePage = Math.min(currentPage, totalPages);
    const pageStart = (activePage - 1) * ROLE_PAGE_SIZE;
    const paginatedRoles = filteredRoles.slice(pageStart, pageStart + ROLE_PAGE_SIZE);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginationMeta: PaginationMeta | null = filteredRoles.length === 0
        ? null
        : {
            total_records: filteredRoles.length,
            total_pages: totalPages,
            current_page: activePage,
            limit: ROLE_PAGE_SIZE,
            has_next: activePage < totalPages,
            has_prev: activePage > 1
        };

    const currentFormStatus: RoleStatus = selectedRole?.status ?? 'active';
    const formModePrefix = selectedRole ? 'edit' : 'create';
    const assignedPermissionsForView = viewRole ? viewRole.permissions.map(getPermissionDefinition) : [];

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handleOpenCreateModal = () => {
        setSelectedRole(null);
        setFormData(EMPTY_FORM_DATA);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (role: RoleRecord) => {
        setSelectedRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: [...role.permissions]
        });
        setIsFormModalOpen(true);
    };

    const handleOpenViewModal = (role: RoleRecord) => {
        setViewRole(role);
        setIsViewModalOpen(true);
    };

    const handleCheckboxChange = (permissionId: string, isChecked: boolean) => {
        setFormData((previous) => {
            if (isChecked) {
                return previous.permissions.includes(permissionId)
                    ? previous
                    : { ...previous, permissions: [...previous.permissions, permissionId] };
            }

            return {
                ...previous,
                permissions: previous.permissions.filter((permission) => permission !== permissionId)
            };
        });
    };

    const handleSaveRole = async () => {
        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            permissions: formData.permissions
        };

        if (!payload.name) {
            showToast('Error', 'Please enter a role name.', 'danger');
            return;
        }

        setIsSubmitting(true);
        try {
            if (selectedRole) {
                await apiClient.put(`/roles/${selectedRole.id}`, payload);
                showToast('Success', 'Role updated successfully.', 'success');
            } else {
                await apiClient.post('/roles/', payload);
                showToast('Success', 'Role created successfully.', 'success');
            }

            setIsFormModalOpen(false);
            setSelectedRole(null);
            setFormData(EMPTY_FORM_DATA);
            await fetchRoles();
        } catch (error: any) {
            showToast('Error', error.response?.data?.detail || 'Failed to save role.', 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async (role: RoleRecord) => {
        const shouldDelete = await confirm({
            title: 'Delete Role',
            message: `Are you sure you want to delete the "${role.name}" role?`,
            confirmLabel: 'Delete Role',
            confirmTone: 'danger'
        });

        if (!shouldDelete) {
            return;
        }

        try {
            await apiClient.delete(`/roles/${role.id}`);
            showToast('Success', 'Role deleted successfully.', 'success');
            await fetchRoles();
        } catch (error: any) {
            showToast('Error', error.response?.data?.detail || 'Failed to delete role.', 'danger');
        }
    };

    return (
        <div className="container-fluid position-relative">
            {toast && (
                <Toast
                    show={true}
                    title={toast.title}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="row justify-content-center">
                <div className="col-12">
                    <PageHeader title="Roles & Permissions">
                        <>
                            <div className="input-group mr-2 d-inline-flex w-auto">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search roles..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                <div className="input-group-append">
                                    <button className="btn btn-primary" type="button" aria-label="Search roles">
                                        <span className="fe fe-search fe-12"></span>
                                    </button>
                                </div>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
                                <span className="fe fe-plus fe-12 mr-2"></span>Create New Role
                            </button>
                        </>
                    </PageHeader>

                    <TableCard
                        loading={loading}
                        loadingText="Loading roles..."
                        isEmpty={paginatedRoles.length === 0}
                        emptyState={(
                            <EmptyState
                                icon="fe-shield"
                                title="No Roles Found"
                                description={searchTerm ? 'No roles matched your search.' : 'Create a role to start assigning permissions.'}
                            />
                        )}
                        responsive={true}
                        className="shadow"
                    >
                        <table className="table table-borderless table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Role Name</th>
                                    <th>Description</th>
                                    <th>Number of Employees</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRoles.map((role) => (
                                    <tr key={role.id}>
                                        <td>{role.id}</td>
                                        <td>{role.name}</td>
                                        <td className="text-muted">{role.description || 'No description provided.'}</td>
                                        <td>{role.user_count}</td>
                                        <td>
                                            <span className={getStatusBadgeClass(role.status)}>
                                                {getStatusLabel(role.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <Dropdown>
                                                <button
                                                    type="button"
                                                    className="dropdown-item"
                                                    onClick={() => handleOpenEditModal(role)}
                                                >
                                                    Edit Role
                                                </button>
                                                <button
                                                    type="button"
                                                    className="dropdown-item"
                                                    onClick={() => handleOpenViewModal(role)}
                                                >
                                                    View Permissions
                                                </button>
                                                {role.id !== 1 && (
                                                    <button
                                                        type="button"
                                                        className="dropdown-item text-danger"
                                                        onClick={() => handleDeleteRole(role)}
                                                    >
                                                        Delete Role
                                                    </button>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableCard>

                    <Pagination
                        meta={paginationMeta}
                        onPageChange={(skip) => setCurrentPage(Math.floor(skip / ROLE_PAGE_SIZE) + 1)}
                    />
                </div>
            </div>

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={selectedRole ? 'Edit Role' : 'Create New Role'}
                isSlide={true}
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" form="role-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : selectedRole ? 'Update Role' : 'Create Role'}
                        </button>
                    </>
                }
            >
                <form
                    id="role-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveRole();
                    }}
                >
                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label htmlFor="roleName">Role Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="roleName"
                                value={formData.name}
                                onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="form-group col-md-6">
                            <label htmlFor="roleStatus">Status</label>
                            <select className="form-control" id="roleStatus" value={currentFormStatus} disabled>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <small className="form-text text-muted">
                                Status display matches the prototype. Role activation is not supported by the current API yet.
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="roleDescription">Description</label>
                        <textarea
                            className="form-control"
                            id="roleDescription"
                            rows={3}
                            placeholder="Describe the role's purpose and responsibilities"
                            value={formData.description}
                            onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                            disabled={isSubmitting}
                        ></textarea>
                    </div>

                    <hr />
                    <h6 className="mb-3">{selectedRole ? 'Manage Permissions' : 'Assign Permissions'}</h6>

                    {PERMISSION_MODULES.map((module) => {
                        const [leftColumn, rightColumn] = splitPermissionsIntoColumns(module.permissions);

                        return (
                            <div className="permission-group mb-4" key={module.title}>
                                <h6 className={`${module.accentClass} mb-2`}>{module.title}</h6>
                                <div className="row">
                                    {[leftColumn, rightColumn].map((column, columnIndex) => (
                                        <div className="col-md-6" key={`${module.title}-${columnIndex}`}>
                                            {column.map((permission) => {
                                                const inputId = `${formModePrefix}-${permission.id}`;
                                                return (
                                                    <div className="custom-control custom-checkbox" key={permission.id}>
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id={inputId}
                                                            checked={formData.permissions.includes(permission.id)}
                                                            onChange={(event) => handleCheckboxChange(permission.id, event.target.checked)}
                                                            disabled={isSubmitting}
                                                        />
                                                        <label className="custom-control-label" htmlFor={inputId}>
                                                            {permission.label}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </form>
            </Modal>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Role Permissions"
                isSlide={true}
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                            Close
                        </button>
                        {viewRole && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleOpenEditModal(viewRole);
                                }}
                            >
                                Edit Role
                            </button>
                        )}
                    </>
                }
            >
                {viewRole && (
                    <div className="row">
                        <div className="col-md-6">
                            <h6 className="text-primary mb-3">Role Information</h6>
                            <table className="table table-sm">
                                <tbody>
                                    <tr>
                                        <td><strong>Role Name:</strong></td>
                                        <td>{viewRole.name}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Description:</strong></td>
                                        <td>{viewRole.description || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Status:</strong></td>
                                        <td>{getStatusLabel(viewRole.status)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total Permissions:</strong></td>
                                        <td>{viewRole.permissions.length}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="col-md-6">
                            <h6 className="text-success mb-3">Assigned Permissions</h6>
                            <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {assignedPermissionsForView.length === 0 ? (
                                    <p className="text-muted mb-0">No permissions assigned.</p>
                                ) : (
                                    assignedPermissionsForView.map((permission) => (
                                        <div className="mb-3" key={permission.id}>
                                            <div className="d-flex align-items-start">
                                                <span className="fe fe-check-circle text-success mr-2 mt-1"></span>
                                                <div>
                                                    <strong>{permission.label}</strong>
                                                    <br />
                                                    <small className="text-muted">{permission.description}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
