import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // <-- Added loading state
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true); // <-- Lock the form

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiClient.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid username or password');
        } finally {
            setIsSubmitting(false); // <-- Unlock the form whether it succeeds or fails
        }
    };

    return (
        <div className="wrapper vh-100">
            <div className="row align-items-center h-100">
                <form className="col-lg-3 col-md-4 col-10 mx-auto text-center" onSubmit={handleLogin}>

                    <a className="navbar-brand mx-auto mt-2 flex-fill text-center" href="/">
                        <img
                            src="/assets/images/logo.png"
                            id="logo"
                            className="navbar-brand-img brand-md"
                            alt="Logo"
                            style={{ width: '20rem', height: 'auto' }}
                        />
                    </a>

                    <h1 className="h6 mb-3">Sign in</h1>

                    {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}

                    <div className="form-group mb-3">
                        <label htmlFor="inputEmail" className="sr-only">Username</label>
                        <input
                            type="text"
                            id="inputEmail"
                            className="form-control form-control-lg"
                            placeholder="Username"
                            required
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting} // <-- Disable while loading
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="inputPassword" className="sr-only">Password</label>
                        <input
                            type="password"
                            id="inputPassword"
                            className="form-control form-control-lg"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting} // <-- Disable while loading
                        />
                    </div>

                    <button
                        className="btn btn-lg btn-primary btn-block w-100"
                        type="submit"
                        disabled={isSubmitting} // <-- Prevent double-clicks
                    >
                        {isSubmitting ? 'Signing in...' : 'Let me in'}
                    </button>
                    <p className="mt-5 mb-3 text-muted">© KimKhawb Hair Studio 2025</p>

                </form>
            </div>
        </div>
    );
};