import React from 'react';
import { Link } from 'react-router-dom';

export const ServerError: React.FC = () => {
    return (
        <div className="wrapper vh-100">
            <div className="align-items-center h-100 d-flex w-50 mx-auto">
                <div className="mx-auto text-center">
                    <h1 className="display-1 m-0 font-weight-bolder text-muted" style={{ fontSize: '80px' }}>503</h1>
                    <h1 className="mb-1 text-muted font-weight-bold">Under Maintenance!</h1>
                    <h6 className="mb-3 text-muted">We are currently experiencing technical difficulties or performing updates.</h6>
                    <button onClick={() => window.location.reload()} className="btn btn-lg btn-primary px-5 mr-2">Try Again</button>
                    <Link to="/dashboard" className="btn btn-lg btn-outline-secondary px-5">Go Back</Link>
                </div>
            </div>
        </div>
    );
};