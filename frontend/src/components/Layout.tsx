import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';

export const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // UI States
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // Data States
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');

        // 1. Fetch Profile Image
        if (userId) {
            apiClient.get(`/employees/${userId}`)
                .then(res => {
                    if (res.data.data.profile_image_path) {
                        setProfileImage(res.data.data.profile_image_path);
                    }
                })
                .catch(err => console.error("Failed to load user avatar for navbar", err));
        }

        // 2. Fetch Notifications
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get('/notifications/');
            const notifs = res.data.data;
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            fetchNotifications(); // Refresh list to update count
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.put('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        navigate('/login');
    };

    // Close dropdowns if user clicks the main content area
    const closeDropdowns = () => {
        if (profileOpen) setProfileOpen(false);
        if (notifOpen) setNotifOpen(false);
    };

    const avatarUrl = profileImage
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profileImage}`
        : '/assets/avatars/placeholder.svg';

    const isActive = (path: string) => location.pathname.startsWith(path) ? 'active' : '';

    return (
        <div className="vertical light">
            <div className="wrapper">

                {/* TOP NAVBAR */}
                <nav className="topnav navbar navbar-light">
                    <div className="d-flex flex-grow-1"></div>
                    <ul className="nav">

                        {/* NOTIFICATIONS DROPDOWN */}
                        <li className={`nav-item dropdown ${notifOpen ? 'show' : ''}`}>
                            <a
                                className="nav-link text-muted my-2"
                                href="#!"
                                onClick={(e) => { e.preventDefault(); setNotifOpen(!notifOpen); setProfileOpen(false); }}
                            >
                                <span className="fe fe-bell fe-16"></span>
                                {unreadCount > 0 && <span className="dot dot-md bg-danger"></span>}
                            </a>

                            <div className={`dropdown-menu dropdown-menu-right shadow ${notifOpen ? 'show' : ''}`} style={{ position: 'absolute', width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                                <div className="dropdown-header d-flex justify-content-between align-items-center pb-2">
                                    <strong className="text-dark">Notifications</strong>
                                    {unreadCount > 0 && (
                                        <a href="#!" className="text-muted small" onClick={(e) => { e.preventDefault(); handleMarkAllAsRead(); }}>
                                            Mark all as read
                                        </a>
                                    )}
                                </div>
                                <div className="dropdown-divider mt-0"></div>

                                {notifications.length === 0 ? (
                                    <div className="dropdown-item text-muted text-center py-4">No new notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <a
                                            key={notif.id}
                                            className={`dropdown-item py-3 border-bottom ${!notif.is_read ? 'bg-light' : ''}`}
                                            href="#!"
                                            onClick={(e) => { e.preventDefault(); if (!notif.is_read) handleMarkAsRead(notif.id); }}
                                            style={{ whiteSpace: 'normal' }}
                                        >
                                            <div className="d-flex align-items-start">
                                                <i className={`fe fe-info fe-16 mt-1 mr-3 text-${notif.type}`}></i>
                                                <div>
                                                    <p className="mb-0 font-weight-bold" style={{ fontSize: '0.9rem' }}>{notif.title}</p>
                                                    <small className="text-muted d-block mt-1">{notif.message}</small>
                                                    <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </small>
                                                </div>
                                            </div>
                                        </a>
                                    ))
                                )}
                            </div>
                        </li>

                        {/* PROFILE DROPDOWN */}
                        <li className={`nav-item dropdown ${profileOpen ? 'show' : ''}`}>
                            <a
                                className="nav-link dropdown-toggle text-muted pr-0"
                                href="#!"
                                onClick={(e) => { e.preventDefault(); setProfileOpen(!profileOpen); setNotifOpen(false); }}
                            >
                                <span className="avatar avatar-sm mt-2">
                                    <img src={avatarUrl} alt="Profile" className="avatar-img rounded-circle" style={{ objectFit: 'cover', width: '32px', height: '32px' }} />
                                </span>
                            </a>
                            <div className={`dropdown-menu dropdown-menu-right shadow ${profileOpen ? 'show' : ''}`} style={{ position: 'absolute' }}>
                                <Link className="dropdown-item" to="/profile" onClick={() => setProfileOpen(false)}>
                                    <i className="fe fe-user mr-2"></i>My Profile
                                </Link>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item text-danger" onClick={handleLogout}>
                                    <i className="fe fe-log-out mr-2"></i>Logout
                                </button>
                            </div>
                        </li>
                    </ul>
                </nav>

                {/* FULL SIDEBAR (Unchanged from your snippet) */}
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
                                <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">
                                    <i className="fe fe-home fe-16"></i><span className="ml-3 item-text">Dashboard</span>
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

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Service Management</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/service-categories')}`} to="/service-categories">
                                    <i className="fe fe-folder fe-16"></i><span className="ml-3 item-text">Service Categories</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/services')}`} to="/services">
                                    <i className="fe fe-settings fe-16"></i><span className="ml-3 item-text">Services</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Financials</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/bookkeeping')}`} to="/bookkeeping">
                                    <i className="fe fe-book fe-16"></i><span className="ml-3 item-text">Ledger</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/invoices')}`} to="/invoices">
                                    <i className="fe fe-file-text fe-16"></i><span className="ml-3 item-text">Invoices</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/payslips')}`} to="/payslips">
                                    <i className="fe fe-dollar-sign fe-16"></i><span className="ml-3 item-text">Payslips</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Staff Management</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/employees')}`} to="/employees">
                                    <i className="fe fe-user fe-16"></i><span className="ml-3 item-text">Employees</span>
                                </Link>
                            </li>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/roles')}`} to="/roles">
                                    <i className="fe fe-shield fe-16"></i><span className="ml-3 item-text">Roles & Permissions</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>Reports</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/reports')}`} to="/reports">
                                    <i className="fe fe-clipboard fe-16"></i><span className="ml-3 item-text">Reports</span>
                                </Link>
                            </li>

                            <p className="text-muted nav-heading mt-4 mb-1"><span>System Configurations</span></p>
                            <li className="nav-item w-100">
                                <Link className={`nav-link ${isActive('/settings')}`} to="/settings">
                                    <i className="fe fe-settings fe-16"></i><span className="ml-3 item-text">Settings</span>
                                </Link>
                            </li>

                        </ul>
                    </nav>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main role="main" className="main-content" onClick={closeDropdowns}>
                    <Outlet />
                </main>

            </div>
        </div>
    );
};