import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';

export const EmployeeCreate: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);

    // Form State
    const [fullName, setFullName] = useState('');
    const [designation, setDesignation] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [roleId, setRoleId] = useState<number | ''>('');
    const [typeId, setTypeId] = useState<number | ''>('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [telephoneNumber, setTelephoneNumber] = useState('');
    const [idCardNumber, setIdCardNumber] = useState('');
    const [salary, setSalary] = useState<number | ''>('');
    const [isActive, setIsActive] = useState(true);

    // Address & Bio State
    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('Pakistan');
    const [specialties, setSpecialties] = useState('');

    // Image Upload State
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string>('/assets/avatars/placeholder.svg');

    // UI State
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!isEditing) return;
            try {
                const response = await apiClient.get(`/employees/${id}`);
                const data = response.data.data;

                setFullName(data.full_name || '');
                setDesignation(data.designation || '');
                setUsername(data.username || '');
                setRoleId(data.role_id || '');
                setTypeId(data.type_id || '');
                setEmail(data.email || '');
                setMobileNumber(data.mobile_number || '');
                setTelephoneNumber(data.telephone_number || '');
                setIdCardNumber(data.id_card_number || '');
                setSalary(data.salary || '');
                setIsActive(data.is_active ?? true);
                setAddressLine(data.address_line || '');
                setCity(data.city || '');
                setProvince(data.province || '');
                setPostalCode(data.postal_code || '');
                setCountry(data.country || 'Pakistan');
                setSpecialties(data.specialties || '');

                if (data.profile_image_path) {
                    setProfilePicPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${data.profile_image_path}`);
                }
            } catch (err: any) {
                console.error("Failed to fetch employee", err);
                setError("Failed to load employee data for editing.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployee();
    }, [id, isEditing]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isEditing && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: any = {
                full_name: fullName,
                designation: designation || null,
                username: username,
                role_id: roleId ? Number(roleId) : null,
                type_id: typeId ? Number(typeId) : 1,
                email: email || null,
                mobile_number: mobileNumber || null,
                telephone_number: telephoneNumber || null,
                id_card_number: idCardNumber || null,
                salary: salary ? Number(salary) : null,
                is_active: isActive,
                address_line: addressLine || null,
                city: city || null,
                province: province || null,
                postal_code: postalCode || null,
                country: country || null,
                specialties: specialties || null
            };

            let targetEmployeeId = id;

            // 1. Save text data first
            if (isEditing) {
                await apiClient.put(`/employees/${id}`, payload);
            } else {
                payload.password = password;
                const res = await apiClient.post('/employees/', payload);
                targetEmployeeId = res.data.data.id.toString();
            }

            // 2. Upload Profile Picture to isolated employee folder
            if (profilePicFile && targetEmployeeId) {
                const formData = new FormData();
                formData.append('file', profilePicFile);
                await apiClient.post(`/employees/${targetEmployeeId}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            navigate('/employees');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'An error occurred while saving the employee.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="mt-5"><Spinner text="Loading employee data..." /></div>;

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title={isEditing ? "Edit Employee" : "Add New Employee"} />

                    {error && <div className="alert alert-danger shadow-sm">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="row d-flex">
                            {/* Left Column: Form Details */}
                            <div className="col-md-8 d-flex">
                                <div className="card shadow mb-4 border-0 flex-fill">
                                    <div className="card-header">
                                        <strong>Employee Details</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <input type="text" className="form-control" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-6 mb-3">
                                                <input type="text" className="form-control" placeholder="Username (Login ID)" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting || isEditing} />
                                            </div>
                                        </div>

                                        {!isEditing && (
                                            <div className="form-row">
                                                <div className="form-group col-md-6 mb-3">
                                                    <input type="password" className="form-control" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                                <div className="form-group col-md-6 mb-3">
                                                    <input type="password" className="form-control" placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-row">
                                            <div className="form-group col-md-4 mb-3">
                                                <input type="text" className="form-control" placeholder="Designation / Job Title" required value={designation} onChange={(e) => setDesignation(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-4 mb-3">
                                                <select className="form-control" value={roleId} onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting}>
                                                    <option value="">Select System Role</option>
                                                    <option value="1">Administrator</option>
                                                </select>
                                            </div>
                                            <div className="form-group col-md-4 mb-3">
                                                <select className="form-control" value={typeId} onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} required>
                                                    <option value="">Select Employee Type</option>
                                                    <option value="1">Permanent</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-mail fe-16 mx-1"></i></span></div>
                                                    <input type="email" className="form-control" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-message-circle fe-16 mx-1"></i></span></div>
                                                    <input type="text" className="form-control" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-phone fe-16 mx-1"></i></span></div>
                                                    <input type="text" className="form-control" placeholder="Telephone Number" value={telephoneNumber} onChange={(e) => setTelephoneNumber(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-credit-card fe-16 mx-1"></i></span></div>
                                                    <input type="text" className="form-control" placeholder="ID Card (12345-1234567-1)" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <input type="number" className="form-control" placeholder="Salary (PKR)" min="0" value={salary} onChange={(e) => setSalary(e.target.value ? Number(e.target.value) : '')} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="custom-control custom-switch mt-2">
                                                    <input type="checkbox" className="custom-control-input" id="inputIsActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isSubmitting} />
                                                    <label className="custom-control-label" htmlFor="inputIsActive">Active Employee</label>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Avatar Upload */}
                            <div className="col-md-4 d-flex mb-4">
                                <div className="card shadow border-0 flex-fill">
                                    <div className="card-header">
                                        <strong>Profile Picture</strong>
                                    </div>
                                    <div className="card-body d-flex align-items-center justify-content-center" style={{ padding: '2rem' }}>
                                        <div className="position-relative">
                                            <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarChange} disabled={isSubmitting} />
                                            <label htmlFor="avatarUpload" style={{ cursor: 'pointer', margin: 0 }}>
                                                <div className="avatar" style={{ width: '230px', height: '230px' }}>
                                                    <img src={profilePicPreview} alt="Profile" className="avatar-img rounded-circle w-100 h-100 shadow-sm" style={{ objectFit: 'cover', border: '4px solid #fff' }} />
                                                </div>
                                                <div className="position-absolute bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ bottom: '10px', right: '10px', width: '45px', height: '45px' }}>
                                                    <i className="fe fe-camera fe-20"></i>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Block */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card shadow mb-4 border-0">
                                    <div className="card-header">
                                        <strong>Address Information</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-row">
                                            <div className="form-group col-md-12 mb-3">
                                                <input type="text" className="form-control" placeholder="Address Line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-4 mb-3">
                                                <input type="text" className="form-control" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-4 mb-3">
                                                <input type="text" className="form-control" placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-4 mb-3">
                                                <input type="text" className="form-control" placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <input type="text" className="form-control" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specialties Block */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card shadow mb-4 border-0">
                                    <div className="card-header">
                                        <strong>Specialties & Skills</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group mb-3">
                                            <textarea className="form-control" rows={4} placeholder="Enter employee specialties, skills, certifications, and areas of expertise..." value={specialties} onChange={(e) => setSpecialties(e.target.value)} disabled={isSubmitting}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12 text-right mb-5">
                                <button type="button" className="btn btn-secondary mr-2" onClick={() => navigate('/employees')} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span> Saving...</> : (isEditing ? 'Update Employee' : 'Save Employee')}
                                </button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};