import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { EmptyState } from '../components/EmptyState';
import { TableCard } from '../components/TableCard';

interface ServiceCategory {
    id: number;
    name: string;
    background_color: string;
    text_color: string;
    is_active: boolean;
    calendar_class?: string | null;
    num_services?: number;
}

export const ServiceCategories: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ id: 0, name: '', background_color: '#f7bed5', text_color: '#ffffff', is_active: true });

    const fetchCategories = async (page: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const response = await apiClient.get(`/services/categories?skip=${skip}&limit=${limit}`);
            setCategories(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error("Failed to load categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(1, 10); }, []);

    const handleOpenModal = (category?: ServiceCategory) => {
        if (category) {
            setFormData({ id: category.id, name: category.name, background_color: category.background_color, text_color: category.text_color, is_active: category.is_active });
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
                console.log("Updating category:", formData);
            } else {
                await apiClient.post('/services/categories', formData);
            }
            setIsModalOpen(false);
            fetchCategories(meta?.current_page || 1, 10);
        } catch (err) {
            console.error("Failed to save category", err);
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Service Categories">
                <div className="input-group mr-2 d-inline-flex w-auto">
                    <input type="text" className="form-control" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button"><span className="fe fe-search fe-12"></span></button>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <span className="fe fe-plus fe-12 mr-2"></span>Create Category
                </button>
            </PageHeader>

            <TableCard
                loading={loading}
                loadingText="Loading categories..."
                isEmpty={categories.length === 0}
                emptyState={<EmptyState icon="fe-folder" title="No Categories Found" description="Create a new category to group your services." />}
            >
                <table className="table table-borderless table-hover mb-0">
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
                        {categories.map((cat) => (
                            <tr key={cat.id}>
                                <td>{cat.id}</td>
                                <td>{cat.name}</td>
                                <td>{cat.num_services}</td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="color-swatch" style={{ width: '20px', height: '20px', backgroundColor: cat.background_color, borderRadius: '4px', marginRight: '8px', border: '1px solid #dee2e6' }}></div>
                                        <span className="text-muted small">{cat.background_color}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <div className="color-swatch" style={{ width: '20px', height: '20px', backgroundColor: cat.text_color, borderRadius: '4px', marginRight: '8px', border: '1px solid #dee2e6' }}></div>
                                        <span className="text-muted small">{cat.text_color}</span>
                                    </div>
                                </td>
                                <td>
                                    {cat.is_active ? <span className="badge badge-pill badge-primary">Active</span> : <span className="badge badge-pill badge-secondary">Inactive</span>}
                                </td>
                                <td>
                                    <Dropdown>
                                        <button className="dropdown-item" onClick={() => handleOpenModal(cat)}>Edit</button>
                                        <button className="dropdown-item">View Details</button>
                                        <button className="dropdown-item">{cat.is_active ? "Deactivate" : "Activate"}</button>
                                    </Dropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>

            <Pagination meta={meta} onPageChange={fetchCategories} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Category" : "Add New Category"} isSlide={true} footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={handleSave}>{isEditing ? "Save Changes" : "Save Category"}</button>
                </>
            }>
                <form>
                    <div className="form-group">
                        <label>Category Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" value={formData.is_active ? 'active' : 'inactive'} onChange={e => setFormData({ ...formData, is_active: e.target.value === 'active' })}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group col-md-6">
                            <label>Background Color</label>
                            <input className="form-control" type="color" value={formData.background_color} onChange={e => setFormData({ ...formData, background_color: e.target.value })} />
                        </div>
                        <div className="form-group col-md-6">
                            <label>Font Color</label>
                            <input className="form-control" type="color" value={formData.text_color} onChange={e => setFormData({ ...formData, text_color: e.target.value })} />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
