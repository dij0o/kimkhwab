import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Toast } from '../components/Toast';

export const Profile: React.FC = () => {
    const userId = localStorage.getItem('user_id');

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ title: string, message: string, type: 'success' | 'danger' } | null>(null);

    // Profile Info State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [designation, setDesignation] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [profilePicPreview, setProfilePicPreview] = useState<string>('');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                setLoading(false);
                showToast("Error", "Session data missing. Please log out and log back in.", "danger");
                return;
            }
            try {
                const response = await apiClient.get(`/employees/${userId}`);
                const data = response.data.data;
                setFullName(data.full_name || '');
                setEmail(data.email || '');
                setMobileNumber(data.mobile_number || '');
                setDesignation(data.designation || '');
                setSpecialties(data.specialties || '');
                if (data.profile_image_path) setProfilePicPreview(data.profile_image_path);
            } catch (err) {
                showToast("Error", "Failed to load profile data.", "danger");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const showToast = (title: string, message: string, type: 'success' | 'danger') => {
        setToast({ title, message, type });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiClient.put(`/employees/${userId}`, {
                full_name: fullName,
                email: email || null,
                mobile_number: mobileNumber || null,
                specialties: specialties || null
            });

            if (profilePicFile) {
                const formData = new FormData();
                formData.append('file', profilePicFile);
                await apiClient.post(`/employees/${userId}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            showToast("Success", "Your profile has been updated.", "success");
        } catch (error: any) {
            showToast("Error", error.response?.data?.detail || "Failed to update profile.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return showToast("Error", "New passwords do not match.", "danger");
        }

        setIsSubmitting(true);
        try {
            await apiClient.put(`/employees/${userId}/password`, {
                current_password: currentPassword,
                new_password: newPassword
            });
            showToast("Success", "Your password has been changed securely.", "success");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast("Error", error.response?.data?.detail || "Failed to update password.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="mt-5"><Spinner text="Loading profile..." /></div>;

    return (
        <div className="container-fluid position-relative">
            {toast && (
                <Toast show={toast !== null} title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <PageHeader title="My Profile" />

            <div className="row align-items-stretch">

                {/* LEFT COLUMN */}
                <div className="col-md-4 mb-4 mb-md-0">
                    <Card
                        title="Profile Picture"
                        className="h-100 mb-0"
                        bodyClassName="text-center d-flex flex-column justify-content-center align-items-center"
                    >
                        {/* Upgraded size to xxl (230px) */}
                        <div className="position-relative d-inline-block mb-4 mt-2">
                            <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarChange} disabled={isSubmitting} />
                            <label htmlFor="avatarUpload" style={{ cursor: 'pointer', margin: 0 }}>
                                <Avatar src={profilePicPreview} size="xxl" className="shadow-sm border" />
                                <div className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ bottom: '10px', right: '10px', width: '45px', height: '45px' }}>
                                    <i className="fe fe-camera fe-20"></i>
                                </div>
                            </label>
                        </div>
                        <h3 className="mb-1 font-weight-bold">{fullName}</h3>
                        <p className="text-muted mb-0">{designation || 'Staff Member'}</p>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-md-8">
                    {/* PROFILE DETAILS CARD */}
                    <Card title="Personal Information" className="mb-4">
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group mb-4">
                                <label>Full Name</label>
                                <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isSubmitting} />
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="form-group mb-0">
                                        <label>Email Address</label>
                                        <div className="input-group">
                                            <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-mail"></i></span></div>
                                            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-0">
                                        <label>Mobile Number</label>
                                        <div className="input-group">
                                            <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-phone"></i></span></div>
                                            <input type="text" className="form-control" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label>Specialties & Bio</label>
                                <textarea className="form-control" rows={4} value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Tell us about your expertise..." disabled={isSubmitting}></textarea>
                            </div>

                            <div className="text-right">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Profile Changes"}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* PASSWORD CHANGE CARD */}
                    <Card title="Change Password" className="mb-0">
                        <form onSubmit={handleUpdatePassword}>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group mb-0">
                                        <label>Current Password</label>
                                        <input type="password" className="form-control" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={isSubmitting} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-0">
                                        <label>New Password</label>
                                        <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} disabled={isSubmitting} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group mb-0">
                                        <label>Confirm New Password</label>
                                        <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} disabled={isSubmitting} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right mt-4">
                                <button type="submit" className="btn btn-outline-primary" disabled={isSubmitting}>
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};