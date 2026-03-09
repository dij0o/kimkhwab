import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import apiClient from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';

export const CustomerCreate: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // <-- 1. Catch the ID from the URL
    const isEditing = Boolean(id); // <-- 2. Flag to determine our mode

    // Text Form State
    const [fullName, setFullName] = useState('');
    const [instagram, setInstagram] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [preferredStylistId, setPreferredStylistId] = useState<number | ''>('');
    const [bio, setBio] = useState('');
    const [mediaConsent, setMediaConsent] = useState(false);

    // File Upload State
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string>('/assets/avatars/placeholder.svg');

    // UI State
    const [isLoading, setIsLoading] = useState(isEditing); // Load immediately if editing
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // --- 3. FETCH EXISTING DATA IF EDITING ---
    useEffect(() => {
        const fetchCustomer = async () => {
            if (!isEditing) return;

            try {
                const response = await apiClient.get(`/customers/${id}`);
                const data = response.data.data;

                // Pre-fill the form
                setFullName(data.full_name || '');
                setPhone(data.phone_number || '');
                setWhatsapp(data.whatsapp_number || '');
                setEmail(data.email || '');
                setInstagram(data.instagram_handle || '');
                setMediaConsent(data.media_consent || false);

                if (data.profile) {
                    setPreferredStylistId(data.profile.preferred_stylist_id || '');
                    setBio(data.profile.allergies_notes || '');
                }

                // If they have a profile picture in the gallery, we would set the preview here
                // For now, we leave the placeholder unless they upload a new one

            } catch (err: any) {
                console.error("Failed to fetch customer", err);
                setError("Failed to load customer data for editing.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomer();
    }, [id, isEditing]);

    // Dropzone setup
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxSize: 52428800 // 50MB
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const customerPayload = {
                full_name: fullName,
                phone_number: phone,
                whatsapp_number: whatsapp || null,
                email: email || null,
                instagram_handle: instagram || null,
                media_consent: mediaConsent,
                profile: {
                    preferences: preferredStylistId ? preferredStylistId.toString() : null,
                    notes: bio || null
                }
            };

            let targetCustomerId = id;

            // --- 4. SMART SAVE: POST if new, PUT/PATCH if editing ---
            if (isEditing) {
                // Update existing customer
                await apiClient.put(`/customers/${id}`, customerPayload);
            } else {
                // Create new customer
                const customerRes = await apiClient.post('/customers/', customerPayload);
                targetCustomerId = customerRes.data.data.id.toString();
            }

            // --- UPLOAD PROFILE PICTURE ---
            if (profilePicFile && targetCustomerId) {
                const formData = new FormData();
                formData.append('file', profilePicFile);
                formData.append('customer_id', targetCustomerId);
                formData.append('is_profile_picture', 'true');
                await apiClient.post('/gallery/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            // --- UPLOAD GALLERY FILES ---
            if (uploadFiles.length > 0 && targetCustomerId) {
                const uploadPromises = uploadFiles.map(file => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('customer_id', targetCustomerId as string);
                    formData.append('is_profile_picture', 'false');
                    return apiClient.post('/gallery/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                });
                await Promise.all(uploadPromises);
            }

            navigate('/customers');

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'An error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setUploadFiles(files => files.filter((_, idx) => idx !== indexToRemove));
    };

    if (isLoading) {
        return <Spinner text="Loading customer data..." />;
    }

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    {/* Dynamic Page Header */}
                    <PageHeader title={isEditing ? "Edit Customer" : "Add New Customer"} />

                    {error && <div className="alert alert-danger shadow-sm">{error}</div>}

                    <form onSubmit={handleSubmit}>

                        {/* ROW 1: Customer Details & Avatar */}
                        <div className="row">
                            <div className="col-md-8">
                                <div className="card shadow mb-4 border-0 h-100">
                                    <div className="card-header"><strong>Customer Details</strong></div>
                                    <div className="card-body">
                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <input type="text" className="form-control" placeholder="Customer Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSubmitting} />
                                            </div>
                                            <div className="form-group col-md-6 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text">@</span></div>
                                                    <input type="text" className="form-control" placeholder="Instagram Handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-10 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-phone fe-16 mx-1"></i></span></div>
                                                    <input type="tel" className="form-control" placeholder="Telephone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-10 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-message-circle fe-16 mx-1"></i></span></div>
                                                    <input type="tel" className="form-control" placeholder="Whatsapp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-10 mb-3">
                                                <div className="input-group">
                                                    <div className="input-group-prepend"><span className="input-group-text"><i className="fe fe-mail fe-16 mx-1"></i></span></div>
                                                    <input type="email" className="form-control" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group col-md-6 mb-3">
                                                <select className="form-control" value={preferredStylistId} onChange={(e) => setPreferredStylistId(Number(e.target.value) || '')} disabled={isSubmitting}>
                                                    <option value="">Select Preferred Stylist</option>
                                                    <option value="1">Sanaa Ali Awan</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card shadow mb-4 border-0 h-100">
                                    <div className="card-header"><strong>Profile Picture</strong></div>
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

                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card shadow mb-4 border-0">
                                    <div className="card-header"><strong>Upload Customer Gallery Photos (Optional)</strong></div>
                                    <div className="card-body">
                                        <div {...getRootProps()} className={`border-2 rounded p-4 text-center ${isDragActive ? 'border-primary bg-light' : 'border-light'}`} style={{ borderStyle: 'dashed', borderWidth: '2px', minHeight: '150px', backgroundColor: isDragActive ? '#e9ecef' : '#f8f9fa', cursor: 'pointer', transition: 'all 0.2s ease', opacity: isSubmitting ? 0.5 : 1 }}>
                                            <input {...getInputProps()} disabled={isSubmitting} />
                                            <i className="fe fe-upload-cloud fe-32 text-muted mb-3 d-block"></i>
                                            {isDragActive ? <p className="text-primary m-0">Drop the files here ...</p> : <p className="text-muted m-0">Drag 'n' drop before/after photos here, or click to browse</p>}
                                        </div>
                                        {uploadFiles.length > 0 && (
                                            <div className="mt-3">
                                                <h6 className="small text-muted text-uppercase">Queued for upload:</h6>
                                                <ul className="list-group">
                                                    {uploadFiles.map((file, idx) => (
                                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center p-2 border-0 bg-light mb-1 rounded">
                                                            <span className="small text-truncate"><i className="fe fe-image mr-2 text-muted"></i>{file.name}</span>
                                                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFile(idx)} disabled={isSubmitting}><i className="fe fe-x"></i></button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card shadow mb-4 border-0">
                                    <div className="card-header"><strong>Additional Bio Information</strong></div>
                                    <div className="card-body">
                                        <div className="form-group mb-3">
                                            <textarea className="form-control" rows={4} placeholder="Enter any additional information..." value={bio} onChange={(e) => setBio(e.target.value)} disabled={isSubmitting}></textarea>
                                        </div>
                                        <div className="custom-control custom-checkbox">
                                            <input type="checkbox" className="custom-control-input" id="mediaConsent" checked={mediaConsent} onChange={(e) => setMediaConsent(e.target.checked)} disabled={isSubmitting} />
                                            <label className="custom-control-label" htmlFor="mediaConsent">Customer consents to having their photos and videos used on the salon's social media pages</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12 text-right mb-5">
                                <button type="button" className="btn btn-secondary mr-2" onClick={() => navigate('/customers')} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span> Saving...</> : (isEditing ? 'Update Customer' : 'Save Customer & Upload Media')}
                                </button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};