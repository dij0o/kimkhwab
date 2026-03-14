from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from schemas.appointment import AppointmentResponse


class DashboardRangeSummary(BaseModel):
    start_date: date
    end_date: date
    label: str
    comparison_start_date: date
    comparison_end_date: date
    comparison_label: str


class DashboardMoneyMetric(BaseModel):
    total: Decimal
    previous_total: Decimal
    trend_percentage: Optional[float] = None


class DashboardCountMetric(BaseModel):
    total: int
    previous_total: int
    trend_percentage: Optional[float] = None


class DashboardChartSeries(BaseModel):
    name: str
    data: List[int]


class DashboardChartResponse(BaseModel):
    categories: List[str]
    series: List[DashboardChartSeries]
    metric_label: str
    group_label: str


class DashboardMetricsResponse(BaseModel):
    income: DashboardMoneyMetric
    expenses: DashboardMoneyMetric
    net_revenue: DashboardMoneyMetric
    appointments_in_range: DashboardCountMetric


class DashboardResponse(BaseModel):
    kpi_range: DashboardRangeSummary
    range: DashboardRangeSummary
    metrics: DashboardMetricsResponse
    chart: DashboardChartResponse
    upcoming_appointments: List[AppointmentResponse]
