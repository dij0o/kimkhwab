import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export const CustomerServiceHistory: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <div className="container-fluid">
            <PageHeader title={`Service History for Customer #${id}`}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            </PageHeader>
            <div className="card shadow border-0">
                <div className="card-body text-center py-5 text-muted">
                    <i className="fe fe-clock fe-32 mb-3"></i>
                    <h5>Service History Tracker</h5>
                    <p>This timeline will be active once the Service History backend endpoint is created.</p>
                </div>
            </div>
        </div>
    );
};