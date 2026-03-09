import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { Dropdown } from '../components/Dropdown';

interface DashboardMetrics {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalRevenue: number;
    upcomingCount: number;
}

interface UpcomingAppointment {
    id: number;
    customer_name: string;
    service_category: string;
    appointment_time: string;
    stylist: string;
}

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
    const [chartSeries, setChartSeries] = useState<{ name: string, data: number[] }[]>([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            setMetrics({
                monthlyIncome: 12500,
                monthlyExpenses: 4200,
                totalRevenue: 8300,
                upcomingCount: 12
            });

            // EXACT data from your apexcharts.custom.js prototype
            setChartSeries([
                { name: "Curly Haircut", data: [15, 25, 18, 22, 19, 12, 28, 16, 20, 15, 25, 18, 22, 19, 12, 28, 16, 20] },
                { name: "Simple Haircut", data: [8, 12, 6, 10, 7, 5, 9, 8, 11, 8, 12, 6, 10, 7, 5, 9, 8, 11] },
                { name: "Hair Dye", data: [5, 8, 4, 7, 6, 3, 8, 5, 7, 5, 8, 4, 7, 6, 3, 8, 5, 7] },
                { name: "Other", data: [4, 5, 3, 6, 4, 2, 5, 3, 5, 4, 5, 3, 6, 4, 2, 5, 3, 5] }
            ]);

            setAppointments([
                { id: 1, customer_name: "Kasimir Lindsey", service_category: "Hair Coloring", appointment_time: "Today 2:00 PM", stylist: "Sarah Johnson" },
                { id: 2, customer_name: "Melinda Levy", service_category: "Haircut", appointment_time: "Today 3:30 PM", stylist: "Michael Chen" },
                { id: 3, customer_name: "Aubrey Sweeney", service_category: "Hair Treatment", appointment_time: "Tomorrow 10:00 AM", stylist: "Emily Davis" },
                { id: 4, customer_name: "Timon Bauer", service_category: "Hair Coloring", appointment_time: "Tomorrow 11:30 AM", stylist: "Sarah Johnson" },
                { id: 5, customer_name: "Kelly Barrera", service_category: "Styling", appointment_time: "Tomorrow 2:00 PM", stylist: "Michael Chen" }
            ]);

        } catch (err) {
            setError("Unable to connect to the server. Showing offline mode.");
            setMetrics(null);
            setChartSeries([]);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // EXACT configuration from your apexcharts.custom.js prototype
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent', // No white background
            fontFamily: 'Overpass, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "40%",
                borderRadius: 4, // 'radius' in old apex charts is now borderRadius
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            type: "datetime",
            categories: [
                "01/01/2020 GMT", "01/02/2020 GMT", "01/03/2020 GMT", "01/04/2020 GMT", "01/05/2020 GMT",
                "01/06/2020 GMT", "01/07/2020 GMT", "01/08/2020 GMT", "01/09/2020 GMT", "01/10/2020 GMT",
                "01/11/2020 GMT", "01/12/2020 GMT", "01/13/2020 GMT", "01/14/2020 GMT", "01/15/2020 GMT",
                "01/16/2020 GMT", "01/17/2020 GMT", "01/18/2020 GMT"
            ],
            labels: { style: { colors: '#a1aab2' } },
            axisBorder: { show: false },
        },
        yaxis: { labels: { style: { colors: '#a1aab2' } } },
        fill: { opacity: 1 },
        colors: ["#f7bed5", "#b8ddd1", "#ffb6c1", "#dda0dd"], // Exact pastel theme
        legend: {
            position: "top",
            labels: { colors: '#a1aab2' }
        },
        grid: {
            borderColor: '#e8e8e8',
            strokeDashArray: 0,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        }
    };

    const formatCurrency = (val: number | undefined) => val !== undefined ? `Rs. ${val.toLocaleString()}` : 'N/A';

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-12">

                    {error && (
                        <div className="alert alert-warning shadow-sm mb-4" role="alert">
                            <i className="fe fe-alert-triangle mr-2"></i> {error}
                        </div>
                    )}

                    {/* Row 1: Metrics */}
                    <div className="row">
                        <div className="col-md-6 col-xl-3 mb-4">
                            <StatCard title="Monthly Income" value={loading ? '...' : formatCurrency(metrics?.monthlyIncome)} trend={metrics ? "+5.5%" : undefined} trendColor="success" icon="fe-download" />
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <StatCard title="Monthly Expenses" value={loading ? '...' : formatCurrency(metrics?.monthlyExpenses)} trend={metrics ? "+16.5%" : undefined} trendColor="danger" icon="fe-upload" />
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <StatCard title="Total Monthly Revenue" value={loading ? '...' : formatCurrency(metrics?.totalRevenue)} trend={metrics ? "+5.5%" : undefined} trendColor="success" icon="fe-dollar-sign" />
                        </div>
                        <div className="col-md-6 col-xl-3 mb-4">
                            <StatCard title="Upcoming Appointments" value={loading ? '...' : (metrics?.upcomingCount || 0).toString()} icon="fe-calendar" />
                        </div>
                    </div>

                    {/* Row 2: Quick Action Cards */}
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
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => alert('Expense feature coming soon!')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-minus-circle fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">Add Expense</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => alert('Income feature coming soon!')}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                    <i className="fe fe-plus-circle fe-32 text-white mb-2"></i>
                                    <h4 className="card-title text-white mb-0 font-weight-bold">Add Income</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Date Range Picker & Filters */}
                    <div className="row align-items-center my-2">
                        <div className="col-auto ml-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="reportrange" className="sr-only">Date Ranges</label>
                                    <div id="reportrange" className="px-2 py-2 text-muted">
                                        <i className="fe fe-calendar fe-16 mx-2"></i>
                                        <span className="small">Last 30 Days</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <button type="button" className="btn btn-sm"><span className="fe fe-refresh-ccw fe-12 text-muted"></span></button>
                                    <button type="button" className="btn btn-sm"><span className="fe fe-filter fe-12 text-muted"></span></button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Row 4: Chart (Removed the Card wrapper to match prototype) */}
                    <div className="row my-4">
                        <div className="col-md-12">
                            <div className="chart-box">
                                {loading ? (
                                    <Spinner text="Loading chart data..." />
                                ) : chartSeries.length > 0 ? (
                                    <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={350} />
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center" style={{ height: '350px' }}>
                                        <span className="text-muted">No chart data available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 5: Upcoming Appointments Table */}
                    <div className="row">
                        <div className="col-md-12">
                            <h6 className="mb-3">Upcoming Appointments</h6>
                            {loading ? (
                                <Spinner text="Loading appointments..." />
                            ) : (
                                <table className="table table-borderless table-striped">
                                    <thead>
                                        <tr role="row">
                                            <th>Customer Name</th>
                                            <th>Service Category</th>
                                            <th>Appointment Time</th>
                                            <th>Stylist</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-muted">
                                                    No upcoming appointments found.
                                                </td>
                                            </tr>
                                        ) : (
                                            appointments.map((appt) => (
                                                <tr key={appt.id}>
                                                    <td>{appt.customer_name}</td>
                                                    <td>{appt.service_category}</td>
                                                    <td>{appt.appointment_time}</td>
                                                    <td>{appt.stylist}</td>
                                                    <td>
                                                        <Dropdown>
                                                            <a className="dropdown-item" href="#!">Edit</a>
                                                            <a className="dropdown-item" href="#!">Cancel</a>
                                                            <a className="dropdown-item" href="#!">Reschedule</a>
                                                        </Dropdown>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};