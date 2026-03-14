import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

// A clean mapping of all system permissions grouped by module
const PERMISSION_MODULES = [
    {
        title: "Customer Management",
        permissions: [
            { id: "view_customers", label: "View Customers" },
            { id: "add_customers", label: "Add Customers" },
            { id: "edit_customers", label: "Edit Customers" },
            { id: "delete_customers", label: "Delete Customers" }
        ]
    },
    {
        title: "Appointment Management",
        permissions: [
            { id: "view_appointments", label: "View Appointments" },
            { id: "add_appointments", label: "Add Appointments" },
            { id: "edit_appointments", label: "Edit Appointments" },
            { id: "cancel_appointments", label: "Cancel Appointments" }
        ]
    },
    {
        title: "Service Management",
        permissions: [
            { id: "view_services", label: "View Services" },
            { id: "add_services", label: "Add Services" },
            { id: "edit_services", label: "Edit Services" },
            { id: "delete_services", label: "Delete Services" }
        ]
    },
    {
        title: "Financials & Billing",
        permissions: [
            { id: "view_invoices", label: "View Invoices" },
            { id: "create_invoices", label: "Create Invoices" },
            { id: "view_ledger", label: "View Ledger" },
            { id: "view_payslips", label: "View & Manage Payslips" }
        ]
    },
    {
        title: "Staff Management",
        permissions: [
            { id: "view_employees", label: "View Employees" },
            { id: "add_employees", label: "Add Employees" },
            { id: "edit_employees", label: "Edit Employees" },
            { id: "manage_roles", label: "Manage Roles & Permissions" }
        ]
    },
    {
        title: "System & Reports",
        permissions: [
            { id: "view_dashboard", label: "View Dashboard Stats" },
            { id: "view_reports", label: "View Analytics & Reports" },
            { id: "manage_gallery", label: "Manage Gallery" }
        ]
    }
];

export const Roles: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    // UI States
    const [toast, setToast] = useState<{ title: string, message: string, type: 'success' | 'danger' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/roles/');
            setRoles(response.data.data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            // Fallback mock data so you can see the UI even if the backend isn't ready yet!
            if (roles.length === 0) {
                setRoles([
                    { id: 1, name: "Administrator", description: "Full access to all system modules.", permissions: ["view_customers", "add_customers", "manage_roles"], user_count: 2 },
                    { id: 2, name: "Manager", description: "Access to reporting, staff scheduling, and operations.", permissions: ["view_customers", "add_customers"], user_count: 1 },
                    { id: 3, name: "Stylist", description: "Can view their own appointments and customer profiles.", permissions: ["view_appointments"], user_count: 5 },
                    { id: 4, name: "Front Desk", description: "Can manage appointments, checkouts, and basic customer data.", permissions: ["view_appointments", "create_invoices"], user_count: 2 }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const showToast = (title: string, message: string, type: 'success' | 'danger') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Modal Handlers ---
    const handleOpenNewModal = () => {
        setFormData({ name: '', description: '', permissions: [] });
        setSelectedRole(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (role: any) => {
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || []
        });
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    // --- Checkbox Handlers ---
    const handleCheckboxChange = (permId: string) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permId);
            if (hasPerm) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, permId] };
            }
        });
    };

    const handleSelectAll = () => {
        const allPerms = PERMISSION_MODULES.flatMap(mod => mod.permissions.map(p => p.id));
        setFormData({ ...formData, permissions: allPerms });
    };

    const handleClearAll = () => {
        setFormData({ ...formData, permissions: [] });
    };

    // --- API Handlers ---
    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (selectedRole) {
                await apiClient.put(`/roles/${selectedRole.id}`, formData);
                showToast("Success", "Role updated successfully.", "success");
            } else {
                await apiClient.post('/roles/', formData);
                showToast("Success", "Role created successfully.", "success");
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error: any) {
            showToast("Error", error.response?.data?.detail || "Failed to save role.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this role? Users assigned to this role must be reassigned.")) return;

        try {
            await apiClient.delete(`/roles/${id}`);
            showToast("Success", "Role deleted.", "success");
            fetchRoles();
        } catch (error: any) {
            showToast("Error", error.response?.data?.detail || "Failed to delete role.", "danger");
        }
    };

    return (
        <div className="container-fluid position-relative">
            {toast && <Toast show={true} title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <PageHeader title="Roles & Permissions">
                <button type="button" className="btn btn-primary" onClick={handleOpenNewModal}>
                    <span className="fe fe-plus fe-16 mr-2"></span>Add Role
                </button>
            </PageHeader>

            <Card className="shadow">
                {loading ? <Spinner text="Loading roles..." /> : (
                    <div className="table-responsive">
                        <table className="table table-hover table-borderless table-vcenter mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Role Name</th>
                                    <th>Description</th>
                                    <th>Users Assigned</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td><strong>{role.name}</strong></td>
                                        <td className="text-muted">{role.description || 'No description provided.'}</td>
                                        <td>
                                            <span className="badge badge-pill badge-light text-muted">
                                                {role.user_count || 0} Users
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-secondary mr-2" onClick={() => handleOpenEditModal(role)}>
                                                <i className="fe fe-edit-2"></i> Edit
                                            </button>
                                            {/* Prevent deleting the root Admin role (usually ID 1) */}
                                            {role.id !== 1 && (
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRole(role.id)}>
                                                    <i className="fe fe-trash-2"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* --- CREATE / EDIT MODAL --- */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedRole ? "Edit Role & Permissions" : "Create New Role"}
                isSlide={true}
                size="lg" // Make it larger to fit the columns!
                footer={
                    <div>
                        <button type="button" className="btn btn-secondary mr-2" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveRole} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Role"}
                        </button>
                    </div>
                }
            >
                <form>
                    <div className="form-group mb-4">
                        <label className="font-weight-bold">Role Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required disabled={isSubmitting || selectedRole?.id === 1} />
                    </div>
                    <div className="form-group mb-4">
                        <label className="font-weight-bold">Description</label>
                        <textarea className="form-control" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} disabled={isSubmitting}></textarea>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-5 mb-3 border-bottom pb-2">
                        <h5 className="mb-0 font-weight-bold">Module Permissions</h5>
                        <div>
                            <button type="button" className="btn btn-sm btn-link text-primary" onClick={handleSelectAll}>Select All</button>
                            <span className="text-muted mx-1">|</span>
                            <button type="button" className="btn btn-sm btn-link text-danger" onClick={handleClearAll}>Clear All</button>
                        </div>
                    </div>

                    {/* Dynamic Checkbox Grid */}
                    <div className="row">
                        {PERMISSION_MODULES.map((module, index) => (
                            <div className="col-md-6 mb-4" key={index}>
                                <div className="card shadow-none border bg-light h-100 mb-0">
                                    <div className="card-body p-3">
                                        <strong className="d-block mb-2 text-dark">{module.title}</strong>
                                        {module.permissions.map(perm => (
                                            <div className="custom-control custom-checkbox mb-1" key={perm.id}>
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`chk_${perm.id}`}
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => handleCheckboxChange(perm.id)}
                                                    disabled={isSubmitting || selectedRole?.id === 1} // Lock admin permissions
                                                />
                                                <label className="custom-control-label" htmlFor={`chk_${perm.id}`} style={{ cursor: 'pointer' }}>
                                                    {perm.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </form>
            </Modal>
        </div>
    );
};