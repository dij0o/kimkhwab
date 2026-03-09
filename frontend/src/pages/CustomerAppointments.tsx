import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export const CustomerAppointments: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <div className="container-fluid">
            <PageHeader title={`Appointments for Customer #${id}`}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            </PageHeader>
            <div className="card shadow border-0">
                <div className="card-body text-center py-5 text-muted">
                    <i className="fe fe-calendar fe-32 mb-3"></i>
                    <h5>Customer Appointments</h5>
                    <p>This table will be populated once the appointments API is fully linked.</p>
                </div>
            </div>
        </div>
    );
};