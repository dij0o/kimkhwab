import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import apiClient from '../api/client';

interface GalleryItem {
    id: number;
    url: string;
    type: 'image' | 'video';
    customerName: string;
    isProfilePicture: boolean;
}

interface CustomerOption {
    id: number;
    full_name: string;
}

export const Gallery: React.FC = () => {
    const [searchParams] = useSearchParams(); // Catch the URL parameters
    const urlCustomerId = searchParams.get('customerId');
    const [loading, setLoading] = useState(true);
    const [media, setMedia] = useState<GalleryItem[]>([]);
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [search, setSearch] = useState('');
    const [isProfilePic, setIsProfilePic] = useState(false);

    // Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Lightbox States
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentMedia, setCurrentMedia] = useState<GalleryItem | null>(null);

    // Upload States
    const [selectedCustomerId, setSelectedCustomerId] = useState(urlCustomerId || ''); // Pre-select if filtered
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);

    // 1. Fetch Actual Media & Customers together
    const loadGalleryData = async () => {
        setLoading(true);
        try {
            // If URL has a customerId, append it to the API call
            const galleryEndpoint = urlCustomerId ? `/gallery/?customer_id=${urlCustomerId}` : '/gallery/';

            // Fetch both at the same time
            const [galleryRes, customersRes] = await Promise.all([
                apiClient.get(galleryEndpoint),
                apiClient.get('/customers/')
            ]);

            const fetchedCustomers = customersRes.data.data;
            setCustomers(fetchedCustomers);

            // Map gallery with correct API URL and Real Customer Name
            const mappedMedia: GalleryItem[] = galleryRes.data.data.map((img: any) => {
                const customer = fetchedCustomers.find((c: any) => c.id === img.customer_id);
                const customerName = customer ? customer.full_name : `Customer #${img.customer_id}`;

                return {
                    id: img.id,
                    url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${img.file_path}`,
                    type: 'image',
                    customerName: customerName,
                    isProfilePicture: img.is_profile_picture
                };
            });

            setMedia(mappedMedia);
        } catch (error) {
            console.error("Failed to load gallery data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGalleryData();
    }, [urlCustomerId]); // Refetch if the URL parameter changes

    // 2. Handle Lightbox Interactions
    const openLightbox = (item: GalleryItem) => {
        setCurrentMedia(item);
        setLightboxOpen(true);
    };

    // 3. React Dropzone Configuration
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'video/*': ['.mp4', '.mov', '.avi']
        },
        maxSize: 52428800 // 50MB
    });

    const handleUpload = async () => {
        if (!selectedCustomerId) {
            alert("Please select a customer first.");
            return;
        }
        if (uploadFiles.length === 0) {
            alert("Please select files to upload.");
            return;
        }

        const uploadPromises = uploadFiles.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('customer_id', selectedCustomerId);
            formData.append('is_profile_picture', isProfilePic.toString());

            return apiClient.post('/gallery/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        });

        try {
            await Promise.all(uploadPromises);
            alert(`Successfully uploaded ${uploadFiles.length} files!`);
            setUploadFiles([]);
            setIsUploadModalOpen(false);
            // Refetch the gallery list to show the new image
            await loadGalleryData();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("One or more files failed to upload.");
        }
    };

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    <PageHeader title="Gallery">
                        <div className="input-group mr-2 d-inline-flex w-auto">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search gallery..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <div className="input-group-append">
                                <button className="btn btn-primary" type="button">
                                    <span className="fe fe-search fe-12"></span>
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <span className="fe fe-upload fe-12 mr-2"></span>Upload Media
                        </button>
                    </PageHeader>

                    {/* GALLERY GRID */}
                    {loading ? (
                        <Spinner text="Loading gallery..." />
                    ) : (
                        <div className="tz-gallery mt-4">
                            <div className="row">
                                {media.map((item) => (
                                    <div key={item.id} className="col-sm-6 col-md-4 mb-4">
                                        {/* Using exact HTML from prototype to utilize gallery.css */}
                                        <a
                                            className="lightbox d-block position-relative"
                                            href="#!"
                                            onClick={(e) => { e.preventDefault(); openLightbox(item); }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img
                                                src={item.url}
                                                alt={`Customer ${item.customerName}`}
                                                className="img-fluid rounded shadow-sm w-100"
                                                style={{ height: '250px', objectFit: 'cover' }}
                                            />
                                            {item.isProfilePicture && (
                                                <div
                                                    className="position-absolute"
                                                    style={{ top: '10px', right: '10px', background: 'var(--primary, #e8a8c3)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}
                                                >
                                                    PROFILE
                                                </div>
                                            )}
                                            <div
                                                className="customer-tag position-absolute"
                                                style={{ bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}
                                            >
                                                {item.customerName}
                                            </div>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* --- CUSTOM LIGHTBOX MODAL --- */}
            {lightboxOpen && currentMedia && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}
                    onClick={() => setLightboxOpen(false)}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content bg-transparent border-0">
                            <div className="modal-header border-0 bg-transparent justify-content-end p-2">
                                <button type="button" className="close text-white" onClick={() => setLightboxOpen(false)} style={{ fontSize: '2rem' }}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body text-center p-0" onClick={e => e.stopPropagation()}>
                                {currentMedia.type === 'video' ? (
                                    <video controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh' }}>
                                        <source src={currentMedia.url} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img src={currentMedia.url} alt="Gallery Enlarge" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- UPLOAD MEDIA SLIDE MODAL --- */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload Media"
                isSlide={true}
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleUpload}>Upload Files</button>
                    </>
                }
            >
                <div className="form-group mb-4">
                    <label className="form-label">Customer</label>
                    <select
                        className="form-control"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">Select a customer...</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.full_name}</option>
                        ))}
                    </select>
                    <small className="form-text text-muted">All media uploaded in this session will be tagged with the selected customer.</small>
                </div>

                <div className="alert alert-info mb-4">
                    <div className="d-flex align-items-center">
                        <i className="fe fe-info fe-16 mr-3"></i>
                        <div>
                            <strong>Important:</strong> All media uploaded at once can only be tagged with one customer at a time.
                        </div>
                    </div>
                </div>

                <div className="form-group mb-4">
                    <div className="custom-control custom-checkbox">
                        <input
                            type="checkbox"
                            className="custom-control-input"
                            id="isProfilePicCheck"
                            checked={isProfilePic}
                            onChange={(e) => setIsProfilePic(e.target.checked)}
                        />
                        <label className="custom-control-label" htmlFor="isProfilePicCheck">
                            Set as Profile Picture?
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Upload Images/Videos</label>

                    {/* REACT DROPZONE CONTAINER */}
                    <div
                        {...getRootProps()}
                        className={`border-2 rounded p-4 text-center ${isDragActive ? 'border-primary bg-light' : 'border-light'}`}
                        style={{
                            borderStyle: 'dashed',
                            borderWidth: '2px',
                            minHeight: '200px',
                            backgroundColor: isDragActive ? '#e9ecef' : '#f8f9fa',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <input {...getInputProps()} />
                        <i className="fe fe-upload-cloud fe-32 text-muted mb-3 d-block"></i>
                        {isDragActive ? (
                            <p className="text-primary m-0">Drop the files here ...</p>
                        ) : (
                            <p className="text-muted m-0">Drag 'n' drop some files here, or click to select files</p>
                        )}
                    </div>

                    <small className="form-text text-muted mt-2">Supported formats: JPG, PNG, GIF, MP4. Max size: 50MB.</small>
                </div>

                {/* FILE PREVIEW LIST */}
                {uploadFiles.length > 0 && (
                    <div className="mt-4">
                        <h6>Selected Files ({uploadFiles.length})</h6>
                        <ul className="list-group">
                            {uploadFiles.map((file, idx) => (
                                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center p-2">
                                    <span className="text-truncate small">{file.name}</span>
                                    <button
                                        className="btn btn-sm btn-link text-danger p-0"
                                        onClick={() => setUploadFiles(files => files.filter((_, i) => i !== idx))}
                                    >
                                        <i className="fe fe-trash-2"></i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal>

        </div>
    );
};