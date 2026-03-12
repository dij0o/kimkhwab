import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { Dropdown } from '../components/Dropdown';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

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

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                setMetrics({ monthlyIncome: 12500, monthlyExpenses: 4200, totalRevenue: 8300, upcomingCount: 12 });
                setChartSeries([
                    { name: "Curly Haircut", data: [15, 25, 18, 22, 19, 12, 28, 16, 20, 15, 25, 18, 22, 19, 12, 28, 16, 20] },
                    { name: "Simple Haircut", data: [8, 12, 6, 10, 7, 5, 9, 8, 11, 8, 12, 6, 10, 7, 5, 9, 8, 11] },
                    { name: "Hair Dye", data: [5, 8, 4, 7, 6, 3, 8, 5, 7, 5, 8, 4, 7, 6, 3, 8, 5, 7] }
                ]);
                setAppointments([
                    { id: 1, customer_name: "Kasimir Lindsey", service_category: "Hair Coloring", appointment_time: "Today 2:00 PM", stylist: "Sarah Johnson" },
                    { id: 2, customer_name: "Melinda Levy", service_category: "Haircut", appointment_time: "Today 3:30 PM", stylist: "Michael Chen" }
                ]);
            } catch (err) {
                setError("Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'Overpass, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: "40%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { type: "datetime", categories: ["01/01/2020 GMT", "01/02/2020 GMT", "01/03/2020 GMT", "01/04/2020 GMT"], labels: { style: { colors: '#a1aab2' } }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: '#a1aab2' } } },
        colors: ["#f7bed5", "#b8ddd1", "#ffb6c1", "#dda0dd"],
        legend: { position: "top", labels: { colors: '#a1aab2' } },
        grid: { borderColor: '#e8e8e8', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
    };

    const formatCurrency = (val: number | undefined) => val !== undefined ? `Rs. ${val.toLocaleString()}` : 'N/A';

    return (
        <div className="container-fluid">
            {error && <div className="alert alert-warning shadow-sm mb-4"><i className="fe fe-alert-triangle mr-2"></i> {error}</div>}

            <div className="row">
                <div className="col-md-6 col-xl-3 mb-4"><StatCard title="Monthly Income" value={loading ? '...' : formatCurrency(metrics?.monthlyIncome)} trend="+5.5%" trendColor="success" icon="fe-download" /></div>
                <div className="col-md-6 col-xl-3 mb-4"><StatCard title="Monthly Expenses" value={loading ? '...' : formatCurrency(metrics?.monthlyExpenses)} trend="+16.5%" trendColor="danger" icon="fe-upload" /></div>
                <div className="col-md-6 col-xl-3 mb-4"><StatCard title="Total Revenue" value={loading ? '...' : formatCurrency(metrics?.totalRevenue)} trend="+5.5%" trendColor="success" icon="fe-dollar-sign" /></div>
                <div className="col-md-6 col-xl-3 mb-4"><StatCard title="Upcoming Appointments" value={loading ? '...' : (metrics?.upcomingCount || 0).toString()} icon="fe-calendar" /></div>
            </div>

            <div className="row">
                {[{ title: "Add Customer", icon: "fe-user-plus", path: "/customers/new" }, { title: "New Appointment", icon: "fe-calendar", path: "/appointments" }, { title: "Add Expense", icon: "fe-minus-circle", path: "#" }, { title: "Add Income", icon: "fe-plus-circle", path: "#" }].map((action, idx) => (
                    <div key={idx} className="col-md-3 mb-4">
                        <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => action.path !== '#' ? navigate(action.path) : alert('Feature coming soon!')}>
                            <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                                <i className={`fe ${action.icon} fe-32 text-white mb-2`}></i>
                                <h4 className="card-title text-white mb-0 font-weight-bold">{action.title}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row my-4">
                <div className="col-md-12">
                    <div className="chart-box">
                        {loading ? <Spinner text="Loading chart data..." /> : chartSeries.length > 0 ? <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={350} /> : <div className="d-flex justify-content-center align-items-center" style={{ height: '350px' }}><span className="text-muted">No chart data available</span></div>}
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <Card title="Upcoming Appointments">
                        {loading ? (
                            <Spinner text="Loading appointments..." />
                        ) : appointments.length === 0 ? (
                            <EmptyState icon="fe-calendar" title="No Upcoming Appointments" description="Your schedule is clear." />
                        ) : (
                            <table className="table table-borderless table-striped mb-0">
                                <thead>
                                    <tr><th>Customer Name</th><th>Service Category</th><th>Appointment Time</th><th>Stylist</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {appointments.map((appt) => (
                                        <tr key={appt.id}>
                                            <td>{appt.customer_name}</td><td>{appt.service_category}</td><td>{appt.appointment_time}</td><td>{appt.stylist}</td>
                                            <td>
                                                <Dropdown>
                                                    <a className="dropdown-item" href="#!">Edit</a><a className="dropdown-item text-danger" href="#!">Cancel</a>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};