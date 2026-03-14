import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('access_token');

    // If there is no token, kick them back to the login page immediately
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If they have a token, allow them to pass through to the requested route
    return <Outlet />;
};