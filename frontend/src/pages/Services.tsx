import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { Pagination, type PaginationMeta } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

interface Service {
    id: number;
    category_id: number;
    name: string;
    price: number;
    is_active: boolean;
    created_at: string;
}

interface ServiceCategory {
    id: number;
    name: string;
}

export const Services: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ id: 0, name: '', category_id: 0, price: 0, is_active: true });

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/services/categories?limit=100');
            setCategories(response.data.data);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    const fetchServices = async (page: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const response = await apiClient.get(`/services/?skip=${skip}&limit=${limit}`);
            setServices(response.data.data);
            setMeta(response.data.meta);
        } catch (err) {
            console.error("Failed to load services", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchServices(1, 10);
    }, []);

    const handleOpenModal = (service?: Service) => {
        if (service) {
            setFormData({ id: service.id, name: service.name, category_id: service.category_id, price: service.price, is_active: service.is_active });
            setIsEditing(true);
        } else {
            setFormData({ id: 0, name: '', category_id: categories[0]?.id || 0, price: 0, is_active: true });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                console.log("Updating service:", formData);
            } else {
                await apiClient.post('/services/', formData);
            }
            setIsModalOpen(false);
            fetchServices(meta?.current_page || 1, 10);
        } catch (err) {
            console.error("Failed to save service", err);
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Services">
                <div className="input-group mr-2 d-inline-flex w-auto">
                    <input type="text" className="form-control" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button"><span className="fe fe-search fe-12"></span></button>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <span className="fe fe-plus fe-12 mr-2"></span>Create Service
                </button>
            </PageHeader>

            <Card>
                {loading ? (
                    <Spinner text="Loading services..." />
                ) : services.length === 0 ? (
                    <EmptyState icon="fe-scissors" title="No Services Found" description="Create a new service to start building your catalog." />
                ) : (
                    <table className="table table-borderless table-hover mb-0">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Service</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id}>
                                    <td>{service.id}</td>
                                    <td>{service.name}</td>
                                    <td>{categories.find(c => c.id === service.category_id)?.name || `Category ${service.category_id}`}</td>
                                    <td>Rs. {Number(service.price).toFixed(2)}</td>
                                    <td>
                                        {service.is_active ? (
                                            <span className="badge badge-primary text-dark">Active</span>
                                        ) : (
                                            <span className="badge badge-secondary text-dark">Inactive</span>
                                        )}
                                    </td>
                                    <td>
                                        <Dropdown>
                                            <button className="dropdown-item" onClick={() => handleOpenModal(service)}>Edit</button>
                                            <button className="dropdown-item">View Details</button>
                                            <button className="dropdown-item">{service.is_active ? "Deactivate" : "Activate"}</button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Pagination meta={meta} onPageChange={fetchServices} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Service" : "Add New Service"} isSlide={true} footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={handleSave}>{isEditing ? "Save Changes" : "Save Service"}</button>
                </>
            }>
                <form>
                    <div className="form-group">
                        <label>Service Name</label>
                        <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select className="form-control" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })} required>
                            <option value="">Select a category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Price</label>
                        <div className="input-group">
                            <div className="input-group-prepend"><span className="input-group-text">Rs. </span></div>
                            <input type="number" className="form-control" step="0.01" min="0" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" value={formData.is_active ? 'true' : 'false'} onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};