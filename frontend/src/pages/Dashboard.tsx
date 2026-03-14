import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';

import apiClient from '../api/client';
import { Card } from '../components/Card';
import { Dropdown } from '../components/Dropdown';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { StatCard } from '../components/StatCard';
import { useFeedback } from '../feedback/FeedbackProvider';

type TrendColor = 'success' | 'danger';
type DashboardRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom';

type DateRange = {
    startDate: string;
    endDate: string;
};

type DashboardMetric = {
    total: number | string;
    previous_total: number | string;
    trend_percentage: number | null;
};

type DashboardChartSeries = {
    name: string;
    data: number[];
};

type DashboardAppointment = {
    id: number;
    start_time: string;
    customer?: { full_name?: string | null } | null;
    employee?: { full_name?: string | null } | null;
    category?: { name?: string | null } | null;
};

type DashboardData = {
    kpi_range: {
        start_date: string;
        end_date: string;
        label: string;
        comparison_start_date: string;
        comparison_end_date: string;
        comparison_label: string;
    };
    range: {
        start_date: string;
        end_date: string;
        label: string;
        comparison_start_date: string;
        comparison_end_date: string;
        comparison_label: string;
    };
    metrics: {
        income: DashboardMetric;
        expenses: DashboardMetric;
        net_revenue: DashboardMetric;
        appointments_in_range: DashboardMetric;
    };
    chart: {
        categories: string[];
        series: DashboardChartSeries[];
        metric_label: string;
        group_label: string;
    };
    upcoming_appointments: DashboardAppointment[];
};

type TrendDisplay = {
    value: string;
    color: TrendColor;
};

const CHART_COLORS = ['#f7bed5', '#b8ddd1', '#ffb6c1', '#dda0dd', '#ffd166', '#8ecae6'];

const PRESET_OPTIONS: Array<{ value: DashboardRangePreset; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' }
];

const formatDateInput = (value: Date): string => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (value: Date, days: number): Date => {
    const nextValue = new Date(value);
    nextValue.setDate(nextValue.getDate() + days);
    return nextValue;
};

const buildPresetRange = (preset: Exclude<DashboardRangePreset, 'custom'>): DateRange => {
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'today') {
        const todayValue = formatDateInput(endOfToday);
        return { startDate: todayValue, endDate: todayValue };
    }

    if (preset === 'last_7_days') {
        return {
            startDate: formatDateInput(addDays(endOfToday, -6)),
            endDate: formatDateInput(endOfToday)
        };
    }

    if (preset === 'this_month') {
        return {
            startDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
            endDate: formatDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0))
        };
    }

    if (preset === 'last_month') {
        return {
            startDate: formatDateInput(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            endDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 0))
        };
    }

    return {
        startDate: formatDateInput(addDays(endOfToday, -29)),
        endDate: formatDateInput(endOfToday)
    };
};

const buildCurrentMonthToDateRange = (): DateRange => {
    const today = new Date();
    return {
        startDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    };
};

const buildPreviousMonthComparableRange = (): DateRange => {
    const today = new Date();
    const previousMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const previousMonthIndex = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    const previousMonthLastDay = new Date(previousMonthYear, previousMonthIndex + 1, 0).getDate();

    return {
        startDate: formatDateInput(new Date(previousMonthYear, previousMonthIndex, 1)),
        endDate: formatDateInput(new Date(previousMonthYear, previousMonthIndex, Math.min(today.getDate(), previousMonthLastDay)))
    };
};

const formatCurrency = (value: number | string | undefined): string => {
    const numericValue = Number(value ?? 0);
    return `Rs. ${numericValue.toLocaleString()}`;
};

const formatFriendlyRange = (range: DateRange): string => {
    const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    return `${formatter.format(new Date(`${range.startDate}T00:00:00`))} - ${formatter.format(new Date(`${range.endDate}T00:00:00`))}`;
};

const formatTrend = (value: number | null, inverted = false): TrendDisplay | undefined => {
    if (value === null) {
        return undefined;
    }

    const sign = value > 0 ? '+' : '';
    const color: TrendColor = inverted
        ? (value > 0 ? 'danger' : 'success')
        : (value >= 0 ? 'success' : 'danger');

    return {
        value: `${sign}${value.toFixed(1)}%`,
        color
    };
};

const formatAppointmentTime = (value: string): string => {
    const appointmentDate = new Date(value);
    return appointmentDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { notify } = useFeedback();

    const initialRange = buildPresetRange('last_30_days');
    const fallbackKpiRange = buildCurrentMonthToDateRange();
    const fallbackKpiComparisonRange = buildPreviousMonthComparableRange();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appliedPreset, setAppliedPreset] = useState<DashboardRangePreset>('last_30_days');
    const [selectedPreset, setSelectedPreset] = useState<DashboardRangePreset>('last_30_days');
    const [draftRange, setDraftRange] = useState<DateRange>(initialRange);
    const [appliedRange, setAppliedRange] = useState<DateRange>(initialRange);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [showChartFilters, setShowChartFilters] = useState(false);

    const loadDashboard = async (range: DateRange, isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const response = await apiClient.get('/financials/dashboard', {
                params: {
                    start_date: range.startDate,
                    end_date: range.endDate
                }
            });
            setDashboard(response.data.data);
        } catch {
            const message = 'Unable to load dashboard analytics right now.';
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadDashboard(appliedRange);
    }, [appliedRange.endDate, appliedRange.startDate]);

    const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextPreset = event.target.value as DashboardRangePreset;
        setSelectedPreset(nextPreset);

        if (nextPreset === 'custom') {
            return;
        }

        const nextRange = buildPresetRange(nextPreset);
        setDraftRange(nextRange);
    };

    const openChartFilters = () => {
        setSelectedPreset(appliedPreset);
        setDraftRange(appliedRange);
        setShowChartFilters(true);
    };

    const closeChartFilters = () => {
        setSelectedPreset(appliedPreset);
        setDraftRange(appliedRange);
        setShowChartFilters(false);
    };

    const handleApplyRange = () => {
        if (selectedPreset !== 'custom') {
            const nextRange = buildPresetRange(selectedPreset);
            setDraftRange(nextRange);
            setAppliedRange(nextRange);
            setAppliedPreset(selectedPreset);
            setShowChartFilters(false);
            return;
        }

        if (!draftRange.startDate || !draftRange.endDate) {
            notify({
                title: 'Missing Dates',
                message: 'Choose both a start and end date before applying a custom range.',
                type: 'warning'
            });
            return;
        }

        if (draftRange.startDate > draftRange.endDate) {
            notify({
                title: 'Invalid Range',
                message: 'The start date must be on or before the end date.',
                type: 'warning'
            });
            return;
        }

        setAppliedRange(draftRange);
        setAppliedPreset(selectedPreset);
        setShowChartFilters(false);
    };

    const handleRefresh = () => {
        void loadDashboard(appliedRange, true);
    };

    const kpiRangeLabel = dashboard?.kpi_range.label ?? formatFriendlyRange(fallbackKpiRange);
    const kpiComparisonLabel = dashboard?.kpi_range.comparison_label ?? formatFriendlyRange(fallbackKpiComparisonRange);
    const chartRangeLabel = dashboard?.range.label ?? formatFriendlyRange(appliedRange);

    const incomeTrend = formatTrend(dashboard?.metrics.income.trend_percentage ?? null);
    const expenseTrend = formatTrend(dashboard?.metrics.expenses.trend_percentage ?? null, true);
    const revenueTrend = formatTrend(dashboard?.metrics.net_revenue.trend_percentage ?? null);
    const appointmentsTrend = formatTrend(dashboard?.metrics.appointments_in_range.trend_percentage ?? null);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'Overpass, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '42%',
                borderRadius: 4
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 1, colors: ['transparent'] },
        xaxis: {
            categories: dashboard?.chart.categories ?? [],
            axisBorder: { show: false },
            labels: {
                rotate: -45,
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: dashboard?.chart.metric_label ?? 'Appointments'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontFamily: 'Overpass, sans-serif'
        },
        tooltip: {
            y: {
                formatter: (value) => `${value} ${dashboard?.chart.metric_label.toLowerCase() ?? 'appointments'}`
            }
        },
        colors: CHART_COLORS.slice(0, Math.max(dashboard?.chart.series.length ?? 0, 1)),
        grid: {
            borderColor: '#e8e8e8',
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title={(
                    <div>
                        <span>Dashboard</span>
                    </div>
                )}
            />

            <div className="d-flex flex-wrap align-items-center mb-3" style={{ gap: '0.5rem' }}>
                <span className="badge badge-light border text-muted">KPI Range</span>
                <span className="small text-muted">
                    Current month to date: {kpiRangeLabel}
                </span>
                <span className="small text-muted">
                    Compared with {kpiComparisonLabel}
                </span>
            </div>

            {error && (
                <div className="alert alert-warning shadow-sm mb-4">
                    <i className="fe fe-alert-triangle mr-2"></i>
                    {error}
                </div>
            )}

            <div className="row">
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard
                        title="Income"
                        value={loading ? '...' : formatCurrency(dashboard?.metrics.income.total)}
                        trend={incomeTrend?.value}
                        trendColor={incomeTrend?.color}
                        icon="fe-download"
                    />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard
                        title="Expenses"
                        value={loading ? '...' : formatCurrency(dashboard?.metrics.expenses.total)}
                        trend={expenseTrend?.value}
                        trendColor={expenseTrend?.color}
                        icon="fe-upload"
                    />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard
                        title="Net Revenue"
                        value={loading ? '...' : formatCurrency(dashboard?.metrics.net_revenue.total)}
                        trend={revenueTrend?.value}
                        trendColor={revenueTrend?.color}
                        icon="fe-dollar-sign"
                    />
                </div>
                <div className="col-md-6 col-xl-3 mb-4">
                    <StatCard
                        title="Appointments This Month"
                        value={loading ? '...' : Number(dashboard?.metrics.appointments_in_range.total ?? 0).toLocaleString()}
                        trend={appointmentsTrend?.value}
                        trendColor={appointmentsTrend?.color}
                        icon="fe-calendar"
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-md-3 mb-4">
                    <div
                        className="card shadow-sm border-0 h-100"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => navigate('/customers/create')}
                    >
                        <div
                            className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}
                        >
                            <i className="fe fe-user-plus fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Add Customer</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div
                        className="card shadow-sm border-0 h-100"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => navigate('/appointments?new=true')}
                    >
                        <div
                            className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}
                        >
                            <i className="fe fe-calendar fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">New Appointment</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div
                        className="card shadow-sm border-0 h-100"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => notify({
                            title: 'Feature Access',
                            message: 'Please use the Bookkeeping Ledger page to record expenses.',
                            type: 'primary'
                        })}
                    >
                        <div
                            className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}
                        >
                            <i className="fe fe-minus-circle fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Add Expense</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div
                        className="card shadow-sm border-0 h-100"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => navigate('/invoices/create')}
                    >
                        <div
                            className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #e8a8c3 100%)', minHeight: '120px' }}
                        >
                            <i className="fe fe-plus-circle fe-32 text-white mb-2"></i>
                            <h4 className="card-title text-white mb-0 font-weight-bold">Walk-in Checkout</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row align-items-center my-2">
                <div className="col-auto ml-auto">
                    <div className="form-inline" style={{ gap: '0.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-sm border bg-white text-muted d-inline-flex align-items-center"
                            onClick={openChartFilters}
                            disabled={loading || refreshing}
                            style={{ minWidth: '18rem', justifyContent: 'flex-start' }}
                        >
                            <span className="fe fe-calendar fe-16 mr-2"></span>
                            <span className="small">{chartRangeLabel}</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm border bg-white"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                            title="Refresh chart data"
                        >
                            <span className={`fe ${refreshing ? 'fe-loader' : 'fe-refresh-ccw'} fe-12 text-muted`}></span>
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm border ${showChartFilters ? 'btn-light' : 'bg-white'}`}
                            onClick={openChartFilters}
                            disabled={loading || refreshing}
                            title="Chart filters"
                        >
                            <span className="fe fe-filter fe-12 text-muted"></span>
                        </button>
                    </div>
                </div>
            </div>

            <Card title="Appointments by Service Category">

                {loading ? (
                    <Spinner text="Loading chart data..." />
                ) : (dashboard?.chart.series.length ?? 0) > 0 ? (
                    <ReactApexChart
                        options={chartOptions}
                        series={dashboard?.chart.series ?? []}
                        type="bar"
                        height={360}
                    />
                ) : (
                    <EmptyState
                        icon="fe-bar-chart-2"
                        title="No Chart Data"
                        description={`No service-category appointments were found for ${chartRangeLabel}.`}
                    />
                )}
            </Card>

            <div className="row mb-5">
                <div className="col-md-12">
                    <Card
                        title={(
                            <div className="d-flex flex-wrap justify-content-between align-items-center" style={{ gap: '0.5rem' }}>
                                <span>Upcoming Appointments</span>
                                <span className="small text-muted">Next 5 booked appointments</span>
                            </div>
                        )}
                    >
                        {loading ? (
                            <Spinner text="Loading appointments..." />
                        ) : (dashboard?.upcoming_appointments.length ?? 0) === 0 ? (
                            <EmptyState
                                icon="fe-calendar"
                                title="No Upcoming Appointments"
                                description="Your schedule is clear."
                            />
                        ) : (
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
                                    {(dashboard?.upcoming_appointments ?? []).map((appointment) => (
                                        <tr key={appointment.id}>
                                            <td>{appointment.customer?.full_name || 'Walk-in'}</td>
                                            <td>{appointment.category?.name || 'Service'}</td>
                                            <td>{formatAppointmentTime(appointment.start_time)}</td>
                                            <td>{appointment.employee?.full_name || 'Unassigned'}</td>
                                            <td>
                                                <Dropdown>
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={() => navigate(`/invoices/create?appointmentId=${appointment.id}`)}
                                                    >
                                                        <i className="fe fe-check-circle mr-2"></i>
                                                        Checkout
                                                    </button>
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={() => navigate('/appointments')}
                                                    >
                                                        <i className="fe fe-calendar mr-2"></i>
                                                        View in Calendar
                                                    </button>
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

            <Modal
                isOpen={showChartFilters}
                onClose={closeChartFilters}
                title="Chart Filters"
                size="md"
                footer={(
                    <>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={closeChartFilters}
                            disabled={loading || refreshing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleApplyRange}
                            disabled={loading || refreshing}
                        >
                            Apply
                        </button>
                    </>
                )}
            >
                <div className="form-group mb-3">
                    <label className="small text-muted mb-2">Chart Range</label>
                    <select
                        className="form-control"
                        value={selectedPreset}
                        onChange={handlePresetChange}
                        disabled={loading || refreshing}
                    >
                        {PRESET_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedPreset === 'custom' ? (
                    <div className="d-flex flex-column" style={{ gap: '0.75rem' }}>
                        <div>
                            <label className="small text-muted mb-2">Start Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={draftRange.startDate}
                                onChange={(event) => setDraftRange((previous) => ({ ...previous, startDate: event.target.value }))}
                                disabled={loading || refreshing}
                            />
                        </div>
                        <div>
                            <label className="small text-muted mb-2">End Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={draftRange.endDate}
                                onChange={(event) => setDraftRange((previous) => ({ ...previous, endDate: event.target.value }))}
                                disabled={loading || refreshing}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="small text-muted mb-0">
                        The chart will update to show appointments grouped by service category for {formatFriendlyRange(draftRange)}.
                    </p>
                )}
            </Modal>
        </div>
    );
};
