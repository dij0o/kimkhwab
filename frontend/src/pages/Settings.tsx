import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';
import { Toast } from '../components/Toast';

export const Settings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ title: string, message: string, type: 'success' | 'danger' } | null>(null);

    // Form State (Mapped to the exact database keys)
    const [config, setConfig] = useState({
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        smtp_from_email: '',
        whatsapp_api_token: '',
        whatsapp_phone_number_id: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await apiClient.get('/settings/');
                const data = response.data.data;
                // Merge fetched data with our default state to ensure no undefined values
                setConfig(prev => ({ ...prev, ...data }));
            } catch (error: any) {
                showToast("Error", error.response?.data?.detail || "Failed to load settings. Are you an Admin?", "danger");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (title: string, message: string, type: 'success' | 'danger') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Convert the flat object state back into the array format the backend expects
        const payload = {
            settings: Object.entries(config).map(([key, value]) => ({ key, value }))
        };

        try {
            await apiClient.put('/settings/', payload);
            showToast("Success", "System configurations saved successfully.", "success");
        } catch (error: any) {
            showToast("Error", error.response?.data?.detail || "Failed to save settings.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="mt-5"><Spinner text="Loading configurations..." /></div>;

    return (
        <div className="container-fluid position-relative">
            {toast && <Toast show={true} title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <PageHeader title="System Configurations" />

            <form onSubmit={handleSave}>
                <div className="row align-items-stretch">

                    {/* EMAIL SMTP CONFIGURATIONS */}
                    <div className="col-md-6 mb-4">
                        <Card title="Email Configuration (SMTP)" className="h-100 mb-0">
                            <p className="text-muted small mb-4">Configure your outgoing email server to send digital receipts, appointment confirmations, and system alerts.</p>

                            <div className="form-group">
                                <label>SMTP Host</label>
                                <input type="text" className="form-control" name="smtp_host" value={config.smtp_host} onChange={handleChange} placeholder="e.g., smtp.gmail.com" disabled={isSubmitting} />
                            </div>

                            <div className="form-group">
                                <label>SMTP Port</label>
                                <input type="text" className="form-control" name="smtp_port" value={config.smtp_port} onChange={handleChange} placeholder="e.g., 587 or 465" disabled={isSubmitting} />
                            </div>

                            <div className="form-group">
                                <label>From Email Address</label>
                                <input type="email" className="form-control" name="smtp_from_email" value={config.smtp_from_email} onChange={handleChange} placeholder="e.g., noreply@kimkhwab.net" disabled={isSubmitting} />
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-6">
                                    <label>SMTP Username</label>
                                    <input type="text" className="form-control" name="smtp_user" value={config.smtp_user} onChange={handleChange} disabled={isSubmitting} />
                                </div>
                                <div className="form-group col-md-6">
                                    <label>SMTP Password / App Password</label>
                                    <input type="password" className="form-control" name="smtp_pass" value={config.smtp_pass} onChange={handleChange} disabled={isSubmitting} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* WHATSAPP API CONFIGURATIONS */}
                    <div className="col-md-6 mb-4">
                        <Card title="WhatsApp Business API" className="h-100 mb-0">
                            <p className="text-muted small mb-4">Enter your Meta Cloud API credentials to automate WhatsApp notifications for appointments and receipts.</p>

                            <div className="form-group">
                                <label>Phone Number ID</label>
                                <input type="text" className="form-control" name="whatsapp_phone_number_id" value={config.whatsapp_phone_number_id} onChange={handleChange} placeholder="e.g., 108343755394140" disabled={isSubmitting} />
                            </div>

                            <div className="form-group">
                                <label>Permanent Access Token</label>
                                <input type="password" className="form-control" name="whatsapp_api_token" value={config.whatsapp_api_token} onChange={handleChange} placeholder="EAAL..." disabled={isSubmitting} />
                            </div>

                            <div className="alert alert-info mt-4" role="alert">
                                <i className="fe fe-info mr-2"></i>
                                Ensure your Meta App is live and has the <strong>whatsapp_business_messaging</strong> permission approved.
                            </div>
                        </Card>
                    </div>

                </div>

                <div className="text-right mt-3">
                    <button type="submit" className="btn btn-primary btn-lg px-5" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Configurations"}
                    </button>
                </div>
            </form>
        </div>
    );
};