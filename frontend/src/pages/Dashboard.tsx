import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    {/* Metrics Row */}
                    <div className="row">
                        <div className="col-md-6 col-xl-3 mb-4">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-3 text-center">
                                            <span className="circle circle-sm bg-primary">
                                                <i className="fe fe-16 fe-download text-white mb-0"></i>
                                            </span>
                                        </div>
                                        <div className="col pr-0">
                                            <p className="small text-muted mb-0">Monthly Income</p>
                                            <span className="h3 mb-0">Rs. 12,500</span>
                                            <span className="small text-success ml-2">+5.5%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-3 text-center">
                                            <span className="circle circle-sm bg-primary">
                                                <i className="fe fe-16 fe-upload text-white mb-0"></i>
                                            </span>
                                        </div>
                                        <div className="col pr-0">
                                            <p className="small text-muted mb-0">Monthly Expenses</p>
                                            <span className="h3 mb-0">Rs. 12,500</span>
                                            <span className="small text-danger ml-2">+16.5%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-3 text-center">
                                            <span className="circle circle-sm bg-primary">
                                                <i className="fe fe-16 fe-dollar-sign text-white mb-0"></i>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <p className="small text-muted mb-0">Total Monthly Revenue</p>
                                            <span className="h3 mb-0">Rs. 12,500</span>
                                            <span className="small text-success ml-2">+5.5%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-3 text-center">
                                            <span className="circle circle-sm bg-primary">
                                                <i className="fe fe-16 fe-calendar text-white mb-0"></i>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <p className="small text-muted mb-0">Upcoming Appointments</p>
                                            <span className="h3 mb-0">12</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Cards Row */}
                    <div className="row">
                        <div className="col-md-3 mb-4">
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => navigate('/customers/new')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-user-plus fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">Add Customer</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => navigate('/appointments')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-calendar fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">New Appointment</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => alert('Action coming soon')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-minus-circle fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">Add Expense</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => alert('Action coming soon')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-plus-circle fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">Add Income</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Static Table representing upcoming appointments */}
                    <div className="row mt-4">
                        <div className="col-md-12">
                            <h6 className="mb-3">Upcoming Appointments</h6>
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <table className="table table-borderless table-striped mb-0">
                                        <thead>
                                            <tr>
                                                <th>Customer Name</th>
                                                <th>Service Category</th>
                                                <th>Appointment Time</th>
                                                <th>Stylist</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Kasimir Lindsey</td>
                                                <td>Hair Coloring</td>
                                                <td>Today 2:00 PM</td>
                                                <td>Sarah Johnson</td>
                                                <td><button className="btn btn-sm btn-outline-primary">View</button></td>
                                            </tr>
                                            <tr>
                                                <td>Melinda Levy</td>
                                                <td>Haircut</td>
                                                <td>Today 3:30 PM</td>
                                                <td>Michael Chen</td>
                                                <td><button className="btn btn-sm btn-outline-primary">View</button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};