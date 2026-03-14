import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
    return (
        <div className="wrapper vh-100">
            <div className="align-items-center h-100 d-flex w-50 mx-auto">
                <div className="mx-auto text-center">
                    <h1 className="display-1 m-0 font-weight-bolder text-muted" style={{ fontSize: '80px' }}>404</h1>
                    <h1 className="mb-1 text-muted font-weight-bold">OOPS!</h1>
                    <h6 className="mb-3 text-muted">The page could not be found.</h6>
                    <Link to="/dashboard" className="btn btn-lg btn-primary px-5">Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};