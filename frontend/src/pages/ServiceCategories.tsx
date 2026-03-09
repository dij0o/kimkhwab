import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';

// Updated schema mapping to match the exact table columns
interface ServiceCategory {
    id: number;
    name: string;
    background_color: string;
    text_color: string;
    is_active: boolean;
    calendar_class?: string | null;
    num_services?: number; // Calculated field if available
}

export const ServiceCategories: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: 0,
        name: '',
        background_color: '#f7bed5',
        text_color: '#ffffff',
        is_active: true
    });

    const fetchCategories = async (page: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const response = await apiClient.get(`/services/categories?skip=${skip}&limit=${limit}`);
            const { data, meta } = response.data;

            setCategories(data);
            setMeta(meta);
        } catch (err) {
            console.error("Failed to load categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(1, 10);
    }, []);

    const handleOpenModal = (category?: ServiceCategory) => {
        if (category) {
            setFormData({
                id: category.id,
                name: category.name,
                background_color: category.background_color,
                text_color: category.text_color,
                is_active: category.is_active
            });
            setIsEditing(true);
        } else {
            setFormData({ id: 0, name: '', background_color: '#f7bed5', text_color: '#ffffff', is_active: true });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                // apiClient.put(`/services/categories/${formData.id}`, formData);
                console.log("Updating category:", formData);
            } else {
                await apiClient.post('/services/categories', {
                    name: formData.name,
                    background_color: formData.background_color,
                    text_color: formData.text_color,
                    is_active: formData.is_active
                });
            }
            setIsModalOpen(false);
            fetchCategories(meta?.current_page || 1, 10);
        } catch (err) {
            console.error("Failed to save category", err);
        }
    };

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title="Service Categories">
                        <div className="input-group mr-2 d-inline-flex w-auto">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search service category..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="input-group-append">
                                <button className="btn btn-primary" type="button">
                                    <span className="fe fe-search fe-12"></span>
                                </button>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                            <span className="fe fe-plus fe-12 mr-2"></span>Create Service Category
                        </button>
                    </PageHeader>

                    {/* TABLE CARD */}
                    <div className="card shadow mb-4 border-0">
                        <div className="card-body">
                            {loading ? (
                                <Spinner text="Loading categories..." />
                            ) : (
                                <table className="table table-borderless table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Service Category</th>
                                            <th>Number of Services</th>
                                            <th>Background Color</th>
                                            <th>Font Color</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4 text-muted">
                                                    No service categories found.
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((cat) => (
                                                <tr key={cat.id}>
                                                    <td>{cat.id}</td>
                                                    {/* Exact typography matching HTML */}
                                                    <td>{cat.name}</td>
                                                    <td>{cat.num_services}</td>

                                                    {/* Background Color Swatch */}
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="color-swatch" style={{ width: '20px', height: '20px', backgroundColor: cat.background_color, borderRadius: '4px', marginRight: '8px', border: '1px solid #dee2e6' }}></div>
                                                            <span className="text-muted small">{cat.background_color}</span>
                                                        </div>
                                                    </td>

                                                    {/* Font Color Swatch */}
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="color-swatch" style={{ width: '20px', height: '20px', backgroundColor: cat.text_color, borderRadius: '4px', marginRight: '8px', border: '1px solid #dee2e6' }}></div>
                                                            <span className="text-muted small">{cat.text_color}</span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {cat.is_active ? (
                                                            <span className="badge badge-pill badge-primary">Active</span>
                                                        ) : (
                                                            <span className="badge badge-pill badge-secondary">Inactive</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Dropdown>
                                                            <button className="dropdown-item" onClick={() => handleOpenModal(cat)}>Edit</button>
                                                            <button className="dropdown-item">View Details</button>
                                                            <button className="dropdown-item">
                                                                {cat.is_active ? "Deactivate" : "Activate"}
                                                            </button>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* PAGINATION */}
                    <Pagination
                        meta={meta}
                        onPageChange={fetchCategories}
                    />

                </div>
            </div>

            {/* --- ADD / EDIT CATEGORY SLIDE MODAL --- */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? "Edit Service Category" : "Add New Service Category"}
                isSlide={true} // Triggers the exact slide-in behavior from the prototype
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>
                            {isEditing ? "Save Changes" : "Save Service Category"}
                        </button>
                    </>
                }
            >
                <form>
                    <div className="form-group">
                        <label htmlFor="categoryName">Service Category Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="categoryName"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="serviceStatus">Status</label>
                        <select
                            className="form-control"
                            id="serviceStatus"
                            value={formData.is_active ? 'active' : 'inactive'}
                            onChange={e => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label htmlFor="serviceBackgroundColor">Background Color</label>
                            <input
                                className="form-control"
                                id="serviceBackgroundColor"
                                type="color"
                                name="backgroundColor"
                                value={formData.background_color}
                                onChange={e => setFormData({ ...formData, background_color: e.target.value })}
                            />
                        </div>
                        <div className="form-group col-md-6">
                            <label htmlFor="serviceFontColor">Font Color</label>
                            <input
                                className="form-control"
                                id="serviceFontColor"
                                type="color"
                                name="fontColor"
                                value={formData.text_color}
                                onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                            />
                        </div>
                    </div>

                </form>
            </Modal>

        </div>
    );
};