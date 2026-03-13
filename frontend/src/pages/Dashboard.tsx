import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { Dropdown } from '../components/Dropdown';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Toast } from '../components/Toast';
import apiClient from '../api/client';

interface Trend { value: string; color: 'success' | 'danger'; }

interface DashboardMetrics {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalRevenue: number;
    upcomingCount: number;
    trends: { income: Trend | null; expense: Trend | null; revenue: Trend | null; };
}

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [chartSeries, setChartSeries] = useState<{ name: string, data: number[] }[]>([]);

    // Custom Toast State
    const [toast, setToast] = useState<{ title: string, message: string } | null>(null);

    const showToast = (title: string, message: string) => {
        setToast({ title, message });
        setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Appointments
                const today = new Date().toISOString().split('T')[0];
                const apptRes = await apiClient.get(`/appointments/?start_date=${today}&limit=50`);
                const upcomingAppts = apptRes.data.data
                    .filter((a: any) => a.status === 'booked')
                    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                setAppointments(upcomingAppts.slice(0, 5).map((appt: any) => ({
                    id: appt.id,
                    customer_name: appt.customer?.full_name || 'Walk-in',
                    service_category: appt.category?.name || 'Service',
                    appointment_time: new Date(appt.start_time).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
                    stylist: appt.employee?.full_name || 'Unassigned'
                })));

                // 2. Fetch Ledger for Dynamic Trends
                const ledgerRes = await apiClient.get('/financials/ledger/?limit=1000');
                const entries = ledgerRes.data.data;

                const now = new Date();
                const cm = now.getMonth(); // Current Month
                const cy = now.getFullYear();

                let cmInc = 0, cmExp = 0, pmInc = 0, pmExp = 0;

                entries.forEach((entry: any) => {
                    const d = new Date(entry.created_at);
                    const m = d.getMonth();
                    const y = d.getFullYear();
                    const amt = Number(entry.amount);

                    if (y === cy && m === cm) {
                        entry.entry_type === 'income' ? cmInc += amt : cmExp += amt;
                    } else if ((y === cy && m === cm - 1) || (cm === 0 && m === 11 && y === cy - 1)) {
                        entry.entry_type === 'income' ? pmInc += amt : pmExp += amt;
                    }
                });

                // Helper to calculate percentage change
                const calcTrend = (current: number, prev: number, isExpense: boolean = false): Trend | null => {
                    if (prev === 0) return current > 0 ? { value: '+100%', color: isExpense ? 'danger' : 'success' } : null;
                    const pct = ((current - prev) / prev) * 100;
                    const sign = pct >= 0 ? '+' : '';
                    // If it's an expense, an increase is bad (danger). For income, increase is good (success).
                    const color = isExpense ? (pct > 0 ? 'danger' : 'success') : (pct >= 0 ? 'success' : 'danger');
                    return { value: `${sign}${pct.toFixed(1)}%`, color };
                };

                const cmRev = cmInc - cmExp;
                const pmRev = pmInc - pmExp;

                setMetrics({
                    monthlyIncome: cmInc,
                    monthlyExpenses: cmExp,
                    totalRevenue: cmRev,
                    upcomingCount: upcomingAppts.length,
                    trends: {
                        income: calcTrend(cmInc, pmInc),
                        expense: calcTrend(cmExp, pmExp, true), // Passing true because expense going up is bad!
                        revenue: calcTrend(cmRev, pmRev)
                    }
                });

                // Chart Data (Mocked until we build analytics)
                setChartSeries([
                    { name: "Haircut", data: [15, 25, 18, 22, 19, 12, 28] },
                    { name: "Coloring", data: [8, 12, 6, 10, 7, 5, 9] }
                ]);
            } catch (err) {
                setError("Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const formatCurrency = (val: number | undefined) => val !== undefined ? `Rs. ${val.toLocaleString()}` : 'N/A';

    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'Overpass, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: "40%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], axisBorder: { show: false } },
        colors: ["#f7bed5", "#b8ddd1", "#ffb6c1", "#dda0dd"],
        grid: { borderColor: '#e8e8e8', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
    };

    return (
        <div className="container-fluid position-relative">
            {/* FLOATING TOAST COMPONENT */}
            <Toast
                show={toast !== null}
                title={toast?.title || ''}
                message={toast?.message || ''}
                type="primary"
                onClose={() => setToast(null)}
            />

            {error && <div className="alert alert-warning shadow-sm mb-4"><i className="fe fe-alert-triangle mr-2"></i> {error}</div>}

            <div className="row">
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard title="Monthly Income" value={loading ? '...' : formatCurrency(metrics?.monthlyIncome)} trend={metrics?.trends.income?.value} trendColor={metrics?.trends.income?.color} icon="fe-download" />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard title="Monthly Expenses" value={loading ? '...' : formatCurrency(metrics?.monthlyExpenses)} trend={metrics?.trends.expense?.value} trendColor={metrics?.trends.expense?.color} icon="fe-upload" />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard title="Total Revenue" value={loading ? '...' : formatCurrency(metrics?.totalRevenue)} trend={metrics?.trends.revenue?.value} trendColor={metrics?.trends.revenue?.color} icon="fe-dollar-sign" />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard title="Upcoming Appointments" value={loading ? '...' : (metrics?.upcomingCount || 0).toString()} icon="fe-calendar" />
                </div>
            </div>

            <div className="row">
                <div className="col-md-3 mb-4">
                    {/* FIXED Customer Route */}
                    <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/customers/create')}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                            <i className="fe fe-user-plus fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Add Customer</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    {/* ADDED ?new=true query parameter */}
                    <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/appointments?new=true')}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                            <i className="fe fe-calendar fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">New Appointment</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    {/* FIXED Native Alert to Toast */}
                    <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => showToast('Feature Access', 'Please use the Bookkeeping Ledger page to record expenses.')}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                            <i className="fe fe-minus-circle fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Add Expense</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    {/* FIXED Native Alert to Toast */}
                    <div className="card shadow-sm border-0 h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/invoices/create')}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}>
                            <i className="fe fe-plus-circle fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Walk-in Checkout</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row my-4">
                <div className="col-md-12">
                    <div className="chart-box">
                        {loading ? <Spinner text="Loading chart data..." /> : chartSeries.length > 0 ? <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={350} /> : <div className="d-flex justify-content-center align-items-center" style={{ height: '350px' }}><span className="text-muted">No chart data available</span></div>}
                    </div>
                </div>
            </div>

            <div className="row mb-5">
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
                                                    <button className="dropdown-item" onClick={() => navigate(`/invoices/create?appointmentId=${appt.id}`)}><i className="fe fe-check-circle mr-2"></i> Checkout</button>
                                                    <button className="dropdown-item text-danger" onClick={() => navigate('/appointments')}><i className="fe fe-edit mr-2"></i> View in Calendar</button>
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