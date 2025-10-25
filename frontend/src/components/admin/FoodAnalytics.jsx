import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import HeatmapChart from './HeatmapChart';
import { 
    exportAnalyticsToPDF, 
    exportDailyTrendsToCSV, 
    exportMealDistributionToCSV, 
    exportWeekdayAnalysisToCSV 
} from '../../utils/exportUtils';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const FoodAnalytics = () => {
    const { token } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [filters, setFilters] = useState({
        dateFilter: 'thisMonth',
        customStartDate: '',
        customEndDate: '',
        mealTypes: 'breakfast,lunch,snacks,dinner',
        statusFilter: 'all',
        hostelId: '',
        gender: ''
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, [filters, token]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/food-api/analytics/dashboard-data?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log('Analytics API Response:', response.data);
            if (response.data && response.data.data) {
                setAnalyticsData(response.data.data);
            } else {
                console.warn('No data in response:', response.data);
                // Set empty data structure to show empty charts
                setAnalyticsData({
                    summary: {
                        totalMealsServed: 0,
                        totalMealsPaused: 0,
                        totalMealsResumed: 0,
                        pausePercentage: 0
                    },
                    trends: { daily: [] },
                    distributions: { mealTypes: {}, weekdays: {} },
                    heatmapData: [],
                    insights: []
                });
            }
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            console.error('Error details:', error.response?.data);
            // Set empty data structure even on error
            setAnalyticsData({
                summary: {
                    totalMealsServed: 0,
                    totalMealsPaused: 0,
                    totalMealsResumed: 0,
                    pausePercentage: 0
                },
                trends: { daily: [] },
                distributions: { mealTypes: {}, weekdays: {} },
                heatmapData: [],
                insights: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleExportPDF = () => {
        if (analyticsData) {
            exportAnalyticsToPDF(analyticsData, filters);
        }
    };

    const handleExportCSV = (type) => {
        if (!analyticsData) return;
        
        switch (type) {
            case 'daily':
                exportDailyTrendsToCSV(analyticsData.trends.daily);
                break;
            case 'meals':
                exportMealDistributionToCSV(analyticsData.distributions.mealTypes);
                break;
            case 'weekdays':
                exportWeekdayAnalysisToCSV(analyticsData.distributions.weekdays);
                break;
            default:
                break;
        }
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading analytics data...</p>
            </div>
        );
    }

    return (
        <div className="food-analytics">
            {/* Filter Section */}
            <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Analytics Filters
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Date Range</label>
                            <select
                                className="form-select"
                                value={filters.dateFilter}
                                onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="thisWeek">This Week</option>
                                <option value="lastWeek">Last Week</option>
                                <option value="thisMonth">This Month</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="thisYear">This Year</option>
                                <option value="lastYear">Last Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        
                        {filters.dateFilter === 'custom' && (
                            <>
                                <div className="col-md-2">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={filters.customStartDate}
                                        onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={filters.customEndDate}
                                        onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        
                        <div className="col-md-3">
                            <label className="form-label">Meal Types</label>
                            <select
                                className="form-select"
                                value={filters.mealTypes}
                                onChange={(e) => handleFilterChange('mealTypes', e.target.value)}
                            >
                                <option value="breakfast,lunch,snacks,dinner">All Meals</option>
                                <option value="breakfast">Breakfast Only</option>
                                <option value="lunch">Lunch Only</option>
                                <option value="snacks">Snacks Only</option>
                                <option value="dinner">Dinner Only</option>
                                <option value="breakfast,lunch">Breakfast & Lunch</option>
                                <option value="lunch,dinner">Lunch & Dinner</option>
                            </select>
                        </div>
                        
                        <div className="col-md-2 d-flex align-items-end">
                            <div className="dropdown">
                                <button
                                    className="btn btn-success dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Export Data
                                </button>
                                <button
                                    className="btn btn-info ms-2"
                                    onClick={async () => {
                                        try {
                                            const response = await axios.get(
                                                `${import.meta.env.VITE_SERVER_URL}/food-api/debug/food-pauses`,
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            console.log('Debug Food Pauses:', response.data);
                                            alert(`Found ${response.data.total} food pause records. Check console for details.`);
                                        } catch (error) {
                                            console.error('Debug error:', error);
                                            alert('Error fetching debug data');
                                        }
                                    }}
                                >
                                    Debug Data
                                </button>
                                <ul className="dropdown-menu">
                                    <li>
                                        <button className="dropdown-item" onClick={handleExportPDF}>
                                            <i className="bi bi-file-pdf me-2"></i>
                                            PDF Report
                                        </button>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => handleExportCSV('daily')}>
                                            <i className="bi bi-file-spreadsheet me-2"></i>
                                            Daily Trends CSV
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => handleExportCSV('meals')}>
                                            <i className="bi bi-file-spreadsheet me-2"></i>
                                            Meal Distribution CSV
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => handleExportCSV('weekdays')}>
                                            <i className="bi bi-file-spreadsheet me-2"></i>
                                            Weekday Analysis CSV
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {analyticsData && (
                <div>
                    {/* Summary Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title">Total Served</h6>
                                            <h2 className="display-4">{analyticsData.summary.totalMealsServed}</h2>
                                        </div>
                                        <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-3">
                            <div className="card bg-warning text-white h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title">Total Paused</h6>
                                            <h2 className="display-4">{analyticsData.summary.totalMealsPaused}</h2>
                                        </div>
                                        <i className="bi bi-pause-circle-fill" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-3">
                            <div className="card bg-success text-white h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title">Total Resumed</h6>
                                            <h2 className="display-4">{analyticsData.summary.totalMealsResumed}</h2>
                                        </div>
                                        <i className="bi bi-play-circle-fill" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-3">
                            <div className="card bg-info text-white h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title">Pause Rate</h6>
                                            <h2 className="display-4">{analyticsData.summary.pausePercentage.toFixed(1)}%</h2>
                                        </div>
                                        <i className="bi bi-percent" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="row mb-4">
                        <div className="col-md-8">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Daily Trends</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '400px' }}>
                                        <Line
                                            data={{
                                                labels: analyticsData.trends.daily.map(d => 
                                                    new Date(d.date).toLocaleDateString()
                                                ),
                                                datasets: [
                                                    {
                                                        label: 'Meals Served',
                                                        data: analyticsData.trends.daily.map(d => d.served),
                                                        borderColor: '#198754',
                                                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                                        fill: true,
                                                        tension: 0.4
                                                    },
                                                    {
                                                        label: 'Meals Paused',
                                                        data: analyticsData.trends.daily.map(d => d.paused),
                                                        borderColor: '#ffc107',
                                                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                        fill: true,
                                                        tension: 0.4
                                                    },
                                                    {
                                                        label: 'Meals Resumed',
                                                        data: analyticsData.trends.daily.map(d => d.resumed),
                                                        borderColor: '#0dcaf0',
                                                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                                                        fill: true,
                                                        tension: 0.4
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'top',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Meal Activity Trends Over Time'
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Number of Meals'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Meal Type Distribution</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '400px' }}>
                                        <Doughnut
                                            data={{
                                                labels: Object.keys(analyticsData.distributions.mealTypes),
                                                datasets: [{
                                                    data: Object.values(analyticsData.distributions.mealTypes).map(m => m.paused),
                                                    backgroundColor: [
                                                        '#fd7e14', // breakfast - orange
                                                        '#0d6efd', // lunch - blue
                                                        '#6f42c1', // snacks - purple
                                                        '#198754'  // dinner - green
                                                    ],
                                                    borderWidth: 2,
                                                    borderColor: '#fff'
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Paused Meals by Type'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Row */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Pause Activity Heatmap</h5>
                                </div>
                                <div className="card-body">
                                    <HeatmapChart 
                                        data={analyticsData.heatmapData} 
                                        title="Pause Density by Day and Meal Type"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Monthly Distribution</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px' }}>
                                        <Bar
                                            data={{
                                                labels: analyticsData.trends.daily.map(d => {
                                                    const date = new Date(d.date);
                                                    return date.getDate();
                                                }).filter((day, index, arr) => arr.indexOf(day) === index),
                                                datasets: [
                                                    {
                                                        label: 'Daily Pauses',
                                                        data: Object.values(analyticsData.trends.daily.reduce((acc, d) => {
                                                            const day = new Date(d.date).getDate();
                                                            acc[day] = (acc[day] || 0) + d.paused;
                                                            return acc;
                                                        }, {})),
                                                        backgroundColor: 'rgba(255, 193, 7, 0.8)',
                                                        borderColor: '#ffc107',
                                                        borderWidth: 1
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'top',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Pause Distribution by Day of Month'
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Number of Pauses'
                                                        }
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: 'Day of Month'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Weekday Analysis</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px' }}>
                                        <Bar
                                            data={{
                                                labels: Object.keys(analyticsData.distributions.weekdays),
                                                datasets: [
                                                    {
                                                        label: 'Served',
                                                        data: Object.values(analyticsData.distributions.weekdays).map(d => d.served),
                                                        backgroundColor: 'rgba(25, 135, 84, 0.8)',
                                                        borderColor: '#198754',
                                                        borderWidth: 1
                                                    },
                                                    {
                                                        label: 'Paused',
                                                        data: Object.values(analyticsData.distributions.weekdays).map(d => d.paused),
                                                        backgroundColor: 'rgba(255, 193, 7, 0.8)',
                                                        borderColor: '#ffc107',
                                                        borderWidth: 1
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'top',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Meal Activity by Day of Week'
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        stacked: false
                                                    },
                                                    x: {
                                                        stacked: false
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Served vs Paused Comparison</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px' }}>
                                        <Bar
                                            data={{
                                                labels: Object.keys(analyticsData.distributions.mealTypes),
                                                datasets: [
                                                    {
                                                        label: 'Served',
                                                        data: Object.values(analyticsData.distributions.mealTypes).map(m => m.served),
                                                        backgroundColor: 'rgba(25, 135, 84, 0.8)',
                                                        borderColor: '#198754',
                                                        borderWidth: 1
                                                    },
                                                    {
                                                        label: 'Paused',
                                                        data: Object.values(analyticsData.distributions.mealTypes).map(m => m.paused),
                                                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                                                        borderColor: '#dc3545',
                                                        borderWidth: 1
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'top',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Served vs Paused by Meal Type'
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        stacked: false
                                                    },
                                                    x: {
                                                        stacked: false
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stacked Area Chart Row */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Stacked Area Chart - Served vs Paused Over Time</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '400px' }}>
                                        <Line
                                            data={{
                                                labels: analyticsData.trends.daily.map(d => 
                                                    new Date(d.date).toLocaleDateString()
                                                ),
                                                datasets: [
                                                    {
                                                        label: 'Meals Served',
                                                        data: analyticsData.trends.daily.map(d => d.served),
                                                        borderColor: '#198754',
                                                        backgroundColor: 'rgba(25, 135, 84, 0.3)',
                                                        fill: 'origin',
                                                        tension: 0.4
                                                    },
                                                    {
                                                        label: 'Meals Paused',
                                                        data: analyticsData.trends.daily.map(d => d.served + d.paused),
                                                        borderColor: '#dc3545',
                                                        backgroundColor: 'rgba(220, 53, 69, 0.3)',
                                                        fill: '-1',
                                                        tension: 0.4
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                interaction: {
                                                    mode: 'index',
                                                    intersect: false,
                                                },
                                                plugins: {
                                                    legend: {
                                                        position: 'top',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Cumulative Meal Activity (Stacked Area)'
                                                    },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context) {
                                                                const dataIndex = context.dataIndex;
                                                                const served = analyticsData.trends.daily[dataIndex].served;
                                                                const paused = analyticsData.trends.daily[dataIndex].paused;
                                                                
                                                                if (context.datasetIndex === 0) {
                                                                    return `Served: ${served}`;
                                                                } else {
                                                                    return `Paused: ${paused}`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        stacked: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Cumulative Meals'
                                                        }
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: 'Date'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistical Summary Row */}
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-calendar-day text-primary" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="mt-2">Peak Pause Day</h6>
                                    <p className="mb-0 fw-bold">
                                        {analyticsData.summary.peakPauseDay ? 
                                            new Date(analyticsData.summary.peakPauseDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 
                                            'No data'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-cup-hot text-warning" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="mt-2">Most Paused Meal</h6>
                                    <p className="mb-0 fw-bold text-capitalize">
                                        {analyticsData.summary.peakPauseMeal || 'No data'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-person text-info" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="mt-2">Avg Pauses/Student</h6>
                                    <p className="mb-0 fw-bold">
                                        {analyticsData.summary.averagePausesPerStudent.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Insights Section */
                    <div className="card">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-lightbulb me-2"></i>
                                Automated Insights
                            </h5>
                        </div>
                        <div className="card-body">
                            {analyticsData.insights.length > 0 ? (
                                <div className="row">
                                    {analyticsData.insights.map((insight, index) => (
                                        <div key={index} className="col-md-6 mb-3">
                                            <div className="alert alert-info mb-0">
                                                <i className="bi bi-info-circle me-2"></i>
                                                {insight}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted">
                                    <i className="bi bi-graph-up" style={{ fontSize: '3rem' }}></i>
                                    <p className="mt-2">No significant patterns detected in the current data range.</p>
                                </div>
                            )}
                        </div>
                    </div>
}</div>
            )}
        </div>
    );
};

export default FoodAnalytics;
