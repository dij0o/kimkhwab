import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import apiClient from '../api/client';

interface GalleryItem { id: number; url: string; type: 'image' | 'video'; customerName: string; isProfilePicture: boolean; }
interface CustomerOption { id: number; full_name: string; }

export const Gallery: React.FC = () => {
    const [searchParams] = useSearchParams();
    const urlCustomerId = searchParams.get('customerId');
    const [loading, setLoading] = useState(true);
    const [media, setMedia] = useState<GalleryItem[]>([]);
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [search, setSearch] = useState('');
    const [isProfilePic, setIsProfilePic] = useState(false);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentMedia, setCurrentMedia] = useState<GalleryItem | null>(null);

    const [selectedCustomerId, setSelectedCustomerId] = useState(urlCustomerId || '');
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);

    const loadGalleryData = async () => {
        setLoading(true);
        try {
            const galleryEndpoint = urlCustomerId ? `/gallery/?customer_id=${urlCustomerId}` : '/gallery/';
            const [galleryRes, customersRes] = await Promise.all([apiClient.get(galleryEndpoint), apiClient.get('/customers/')]);
            const fetchedCustomers = customersRes.data.data;
            setCustomers(fetchedCustomers);

            setMedia(galleryRes.data.data.map((img: any) => ({
                id: img.id,
                url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${img.file_path}`,
                type: 'image',
                customerName: fetchedCustomers.find((c: any) => c.id === img.customer_id)?.full_name || `Customer #${img.customer_id}`,
                isProfilePicture: img.is_profile_picture
            })));
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadGalleryData(); }, [urlCustomerId]);

    const onDrop = useCallback((acceptedFiles: File[]) => setUploadFiles(prev => [...prev, ...acceptedFiles]), []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }, maxSize: 52428800 });

    const handleUpload = async () => {
        if (!selectedCustomerId || uploadFiles.length === 0) return alert("Select customer and files.");
        try {
            await Promise.all(uploadFiles.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('customer_id', selectedCustomerId);
                formData.append('is_profile_picture', isProfilePic.toString());
                return apiClient.post('/gallery/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }));
            setUploadFiles([]);
            setIsUploadModalOpen(false);
            await loadGalleryData();
        } catch (error) {
            alert("Upload failed.");
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader title="Gallery">
                <div className="input-group mr-2 d-inline-flex w-auto">
                    <input type="text" className="form-control" placeholder="Search gallery..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="input-group-append"><button className="btn btn-primary" type="button"><span className="fe fe-search fe-12"></span></button></div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                    <span className="fe fe-upload fe-12 mr-2"></span>Upload Media
                </button>
            </PageHeader>

            {loading ? <Spinner text="Loading gallery..." /> : media.length === 0 ? (
                <Card>
                    <EmptyState icon="fe-image" title="No Media Found" description="Upload photos to start building the portfolio." />
                </Card>
            ) : (
                <div className="tz-gallery mt-4">
                    <div className="row">
                        {media.map((item) => (
                            <div key={item.id} className="col-sm-6 col-md-4 mb-4">
                                <a className="lightbox d-block position-relative" href="#!" onClick={(e) => { e.preventDefault(); setCurrentMedia(item); setLightboxOpen(true); }} style={{ cursor: 'pointer' }}>
                                    <img src={item.url} alt="Gallery item" className="img-fluid rounded shadow-sm w-100" style={{ height: '250px', objectFit: 'cover' }} />
                                    {item.isProfilePicture && <div className="position-absolute" style={{ top: '10px', right: '10px', background: 'var(--primary, #e8a8c3)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>PROFILE</div>}
                                    <div className="customer-tag position-absolute" style={{ bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>{item.customerName}</div>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LIGHTBOX & UPLOAD MODALS STAY THE SAME */}
            {lightboxOpen && currentMedia && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }} onClick={() => setLightboxOpen(false)}>
                    <div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content bg-transparent border-0"><div className="modal-header border-0 bg-transparent justify-content-end p-2"><button type="button" className="close text-white" onClick={() => setLightboxOpen(false)} style={{ fontSize: '2rem' }}><span>&times;</span></button></div><div className="modal-body text-center p-0" onClick={e => e.stopPropagation()}><img src={currentMedia.url} alt="Enlarged" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} /></div></div></div>
                </div>
            )}

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Media" isSlide={true} footer={<><button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button><button type="button" className="btn btn-primary" onClick={handleUpload}>Upload</button></>}>
                <div className="form-group mb-4">
                    <label>Customer</label>
                    <select className="form-control" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                </div>
                <div className="form-group mb-4"><div className="custom-control custom-checkbox"><input type="checkbox" className="custom-control-input" id="isProfilePicCheck" checked={isProfilePic} onChange={(e) => setIsProfilePic(e.target.checked)} /><label className="custom-control-label" htmlFor="isProfilePicCheck">Set as Profile Picture?</label></div></div>
                <div className="form-group">
                    <label>Upload Images</label>
                    <div {...getRootProps()} className="border-2 rounded p-4 text-center border-light" style={{ borderStyle: 'dashed', backgroundColor: '#f8f9fa', cursor: 'pointer' }}>
                        <input {...getInputProps()} />
                        <i className="fe fe-upload-cloud fe-32 text-muted mb-3 d-block"></i><p className="text-muted m-0">Drag 'n' drop or click here to upload</p>
                    </div>
                </div>
                {uploadFiles.length > 0 && (
                    <ul className="list-group mt-3">
                        {uploadFiles.map((file, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center p-2">
                                <span className="small">{file.name}</span><button className="btn btn-sm btn-link text-danger p-0" onClick={() => setUploadFiles(files => files.filter((_, i) => i !== idx))}><i className="fe fe-trash-2"></i></button>
                            </li>
                        ))}
                    </ul>
                )}
            </Modal>
        </div>
    );
};