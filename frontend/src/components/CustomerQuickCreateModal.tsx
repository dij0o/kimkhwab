import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Modal } from './Modal';

export interface QuickCustomerRecord {
    id: number;
    full_name: string;
    phone_number?: string | null;
    profile_image_url?: string | null;
    is_active?: boolean;
}

interface EmployeeOption {
    id: number;
    full_name: string;
    designation?: string | null;
}

interface CustomerQuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (customer: QuickCustomerRecord) => void;
    employees: EmployeeOption[];
}

const EMPTY_FORM = {
    fullName: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    instagramHandle: '',
    preferredEmployeeId: '',
    notes: '',
    mediaConsent: true
};

export const CustomerQuickCreateModal: React.FC<CustomerQuickCreateModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    employees
}) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(EMPTY_FORM);
            setIsSubmitting(false);
            setError('');
        }
    }, [isOpen]);

    const handleChange = (field: keyof typeof EMPTY_FORM, value: string | boolean) => {
        setFormData((previous) => ({ ...previous, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.fullName.trim()) {
            setError('Customer name is required.');
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setError('Telephone number is required.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await apiClient.post('/customers/', {
                full_name: formData.fullName.trim(),
                phone_number: formData.phoneNumber.trim(),
                whatsapp_number: formData.whatsappNumber.trim() || null,
                email: formData.email.trim() || null,
                instagram_handle: formData.instagramHandle.trim() || null,
                preferred_employee_id: formData.preferredEmployeeId ? Number(formData.preferredEmployeeId) : null,
                media_consent: formData.mediaConsent,
                profile: {
                    preferences: null,
                    notes: formData.notes.trim() || null
                }
            });

            onCreated(response.data.data as QuickCustomerRecord);
            onClose();
        } catch (submitError: any) {
            setError(submitError.response?.data?.detail || 'Failed to create customer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Walk-in Customer"
            isSlide={true}
            size="lg"
            footer={(
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" form="quick-customer-form" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Customer'}
                    </button>
                </>
            )}
        >
            <form id="quick-customer-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerName">Customer Name</label>
                        <input
                            id="quickCustomerName"
                            type="text"
                            className="form-control"
                            value={formData.fullName}
                            onChange={(event) => handleChange('fullName', event.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerPhone">Telephone Number</label>
                        <input
                            id="quickCustomerPhone"
                            type="tel"
                            className="form-control"
                            value={formData.phoneNumber}
                            onChange={(event) => handleChange('phoneNumber', event.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerWhatsapp">WhatsApp Number</label>
                        <input
                            id="quickCustomerWhatsapp"
                            type="tel"
                            className="form-control"
                            value={formData.whatsappNumber}
                            onChange={(event) => handleChange('whatsappNumber', event.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerEmail">Email</label>
                        <input
                            id="quickCustomerEmail"
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={(event) => handleChange('email', event.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerInstagram">Instagram Handle</label>
                        <input
                            id="quickCustomerInstagram"
                            type="text"
                            className="form-control"
                            value={formData.instagramHandle}
                            onChange={(event) => handleChange('instagramHandle', event.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group col-md-6">
                        <label htmlFor="quickCustomerStylist">Preferred Stylist</label>
                        <select
                            id="quickCustomerStylist"
                            className="form-control"
                            value={formData.preferredEmployeeId}
                            onChange={(event) => handleChange('preferredEmployeeId', event.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Preferred Stylist</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.full_name}{employee.designation ? ` (${employee.designation})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="quickCustomerNotes">Notes</label>
                    <textarea
                        id="quickCustomerNotes"
                        className="form-control"
                        rows={3}
                        value={formData.notes}
                        onChange={(event) => handleChange('notes', event.target.value)}
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <div className="custom-control custom-checkbox">
                    <input
                        id="quickCustomerConsent"
                        type="checkbox"
                        className="custom-control-input"
                        checked={formData.mediaConsent}
                        onChange={(event) => handleChange('mediaConsent', event.target.checked)}
                        disabled={isSubmitting}
                    />
                    <label className="custom-control-label" htmlFor="quickCustomerConsent">
                        Customer consents to photo and video use on social media
                    </label>
                </div>
            </form>
        </Modal>
    );
};
