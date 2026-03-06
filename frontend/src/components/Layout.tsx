import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    // Helper to highlight the active menu item
    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <div className="vertical light">
            <div className="wrapper">

                {/* TOP NAVBAR */}
                <nav className="topnav navbar navbar-light">
                    <div className="d-flex flex-grow-1"></div>
                    <ul className="nav">
                        <li className="nav-item nav-notif">
                            <a className="nav-link text-muted my-2" href="#!">
                                <span className="fe fe-bell fe-16"></span>
                                <span className="dot dot-md bg-success"></span>
                            </a>
                        </li>
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle text-muted pr-0"
                                href="#!"
                                onClick={(e) => { e.preventDefault(); setProfileOpen(!profileOpen); }}
                            >
                                <span className="avatar avatar-sm mt-2">
                                    <img src="/assets/avatars/face-1.jpg" alt="..." className="avatar-img rounded-circle" />
                                </span>
                            </a>
                            {/* React state handles the dropdown visibility instead of jQuery */}
                            <div className={`dropdown-menu dropdown-menu-right ${profileOpen ? 'show' : ''}`} style={{ position: 'absolute', top: '100%', right: '0' }}>
                                <a className="dropdown-item" href="#!">Profile</a>
                                <a className="dropdown-item" href="#!">Activities</a>
                                <button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button>
                            </div>
                        </li>
                    </ul>
                </nav>

                {/* SIDEBAR */}
                <aside className="sidebar-left border-right bg-white shadow" id="leftSidebar" data-simplebar>
                    <a href="#!" className="btn collapseSidebar toggle-btn d-lg-none text-muted ml-2 mt-3">
                        <i className="fe fe-x"><span className="sr-only"></span></i>
                    </a>
                    <nav className="vertnav navbar navbar-light">
                        <div className="w-100 mb-4 d-flex">
                            <Link className="navbar-brand mx-auto mt-2 flex-fill text-center" to="/dashboard">
                                <img src="/assets/images/logo.png" id="logo" className="navbar-brand-img brand-md" alt="Logo" style={{ width: '8rem', height: 'auto' }} />
                            </Link>
                        </div>

                        <ul className="navbar-nav flex-fill w-100 mb-2">
                            <p className="text-muted nav-heading mt-4 mb-1"><span>Overview</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                                    <i className="fe fe-home fe-16"></i>
                                    <span className="ml-3 item-text">Dashboard</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Customer Management</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/customers')}`} to="/customers">
                                    <i className="fe fe-users fe-16"></i><span className="ml-3 item-text">Customers</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/appointments')}`} to="/appointments">
                                    <i className="fe fe-calendar fe-16"></i><span className="ml-3 item-text">Appointments</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/gallery')}`} to="/gallery">
                                    <i className="fe fe-image fe-16"></i><span className="ml-3 item-text">Gallery</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Financials</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/invoices')}`} to="/invoices">
                                    <i className="fe fe-file-text fe-16"></i><span className="ml-3 item-text">Invoices</span>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* MAIN CONTENT AREA (Pages inject here) */}
                <main role="main" className="main-content">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};