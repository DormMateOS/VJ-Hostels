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
        mealTypes: 'all'
    });

    const getDefaultAnalyticsData = () => ({
        summary: {
            totalMealsServed: 0,
            totalMealsPaused: 0,
            totalMealsResumed: 0,
            pausePercentage: 0,
            averagePausesPerStudent: 0,
            peakPauseDay: null,
            peakPauseMeal: null
        },
        trends: { 
            daily: [
                { date: new Date().toISOString(), served: 0, paused: 0, resumed: 0 }
            ] 
        },
        distributions: { 
            mealTypes: { breakfast: { paused: 0, served: 0 }, lunch: { paused: 0, served: 0 }, snacks: { paused: 0, served: 0 }, dinner: { paused: 0, served: 0 } },
            weekdays: { Monday: { served: 0, paused: 0 }, Tuesday: { served: 0, paused: 0 }, Wednesday: { served: 0, paused: 0 }, Thursday: { served: 0, paused: 0 }, Friday: { served: 0, paused: 0 }, Saturday: { served: 0, paused: 0 }, Sunday: { served: 0, paused: 0 } }
        },
        insights: []
    });

    // Initialize with default data
    useEffect(() => {
        console.log('[UseEffect] Initializing analytics component');
        setAnalyticsData(getDefaultAnalyticsData());
        console.log('[UseEffect] Default analytics data set');
    }, []);

    // Fetch data when filters change
    useEffect(() => {
        console.log('[UseEffect] Filters or token changed');
        console.log('[UseEffect] Filters:', filters);
        console.log('[UseEffect] Token present:', !!token);
        if (token) {
            console.log('[UseEffect] Triggering fetchAnalyticsData');
            fetchAnalyticsData();
        } else {
            console.warn('[UseEffect] No token available, skipping fetch');
        }
    }, [filters, token]);

    const fetchAnalyticsData = async () => {
        if (!token) {
            console.warn('[Analytics] No token available - skipping fetch');
            return;
        }
        
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            const fullUrl = `${import.meta.env.VITE_SERVER_URL}/food-api/analytics/dashboard-data?${queryParams}`;
            
            console.log('========== ANALYTICS DATA FETCH START ==========');
            console.log('[Filters] Current filters:', filters);
            console.log('[Query] Query params string:', queryParams);
            console.log('[URL] Full request URL:', fullUrl);
            console.log('[Auth] Token present:', !!token);
            console.log('[Server] VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL);
            
            const response = await axios.get(fullUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('[Response] HTTP Status:', response.status);
            console.log('[Response] Full response object:', response.data);
            console.log('[Response] response.data.success:', response.data?.success);
            console.log('[Response] response.data.data type:', typeof response.data?.data);
            console.log('[Response] response.data.data keys:', Object.keys(response.data?.data || {}));
            
            if (response.data?.data) {
                console.log('[DATA] Extracted analytics data successfully');
                console.log('[DATA] Summary:', response.data.data.summary);
                console.log('[DATA] Trends daily length:', response.data.data.trends?.daily?.length || 0);
                console.log('[DATA] Trends daily sample:', response.data.data.trends?.daily?.[0]);
                console.log('[DATA] Meal types keys:', Object.keys(response.data.data.distributions?.mealTypes || {}));
                console.log('[DATA] Weekdays keys:', Object.keys(response.data.data.distributions?.weekdays || {}));
                console.log('[DATA] Insights count:', response.data.data.insights?.length || 0);
                
                setAnalyticsData(response.data.data);
                console.log('[State] ✓ Analytics data state updated successfully');
            } else {
                console.warn('[DATA] response.data.data is undefined or null');
                console.log('[DATA] Available keys in response.data:', Object.keys(response.data || {}));
                
                if (response.data?.success) {
                    console.log('[Fallback] Response successful, attempting alternative structure');
                    setAnalyticsData(response.data);
                } else {
                    console.warn('[Fallback] No success flag in response');
                    console.log('[Fallback] Using default analytics data');
                    setAnalyticsData(getDefaultAnalyticsData());
                }
            }
            console.log('========== ANALYTICS DATA FETCH END (SUCCESS) ==========\n');
        } catch (error) {
            console.error('========== ANALYTICS DATA FETCH ERROR ==========');
            console.error('[Error] Error type:', error.constructor.name);
            console.error('[Error] Error message:', error.message);
            console.error('[Error] Full error object:', error);
            
            if (error.response) {
                console.error('[HTTP] Status code:', error.response.status);
                console.error('[HTTP] Status text:', error.response.statusText);
                console.error('[HTTP] Response data:', error.response.data);
                console.error('[HTTP] Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('[Request] No response received');
                console.error('[Request] Request object:', error.request);
            } else {
                console.error('[Setup] Error setting up request:', error.message);
            }
            
            alert(`Error fetching analytics: ${error.response?.data?.message || error.message}`);
            console.log('[Fallback] Loading default analytics data due to error');
            setAnalyticsData(getDefaultAnalyticsData());
            console.error('========== ANALYTICS DATA FETCH ERROR END ==========\n');
        } finally {
            setLoading(false);
            console.log('[Loading] setLoading(false) called');
        }
    };

    const handleFilterChange = (key, value) => {
        console.log(`[Filter Change] ${key}: "${value}"`);
        setFilters(prev => {
            const updated = {
                ...prev,
                [key]: value
            };
            console.log('[Filter Change] Updated filters:', updated);
            return updated;
        });
    };

    const handleExportPDF = () => {
        console.log('[Export] PDF export requested');
        console.log('[Export] Current analytics data:', analyticsData);
        if (analyticsData) {
            console.log('[Export] ✓ Data available for PDF export');
            alert('PDF Export feature - Check console for data');
        } else {
            console.warn('[Export] ✗ No analytics data available for PDF');
        }
    };

    const handleExportCSV = (type) => {
        console.log(`[Export] CSV export requested for type: ${type}`);
        if (!analyticsData) {
            console.warn('[Export] ✗ No analytics data available for CSV export');
            return;
        }
        
        console.log('[Export] ✓ Data available for CSV export');
        console.log('[Export] Exporting data:', analyticsData);
        alert(`${type} CSV Export feature - Check console for data`);
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
                {/* ## TODO : total served are not coming form DB since not present create a collection to store each meal's served count */}
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
                                <option value="all">All Meals</option>
                                <option value="breakfast">Breakfast Only</option>
                                <option value="lunch">Lunch Only</option>
                                <option value="snacks">Snacks Only</option>
                                <option value="dinner">Dinner Only</option>
                                <option value="breakfast,lunch">Breakfast & Lunch</option>
                                <option value="lunch,dinner">Lunch & Dinner</option>
                            </select>
                        </div>
                        
                        <div className="col-md-3 d-flex align-items-end gap-2">
                            <button
                                className="btn btn-success"
                                onClick={handleExportPDF}
                            >
                                <i className="bi bi-file-pdf me-2"></i>
                                Export PDF
                            </button>
                            <button
                                className="btn btn-info"
                                onClick={() => handleExportCSV('daily')}
                            >
                                <i className="bi bi-file-csv me-2"></i>
                                Export CSV
                            </button>
                            <button
                                className="btn btn-warning"
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
                                <i className="bi bi-bug me-2"></i>
                                Debug
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading analytics data...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <div>
                    {(() => {
                        const data = analyticsData || getDefaultAnalyticsData();
                        console.log('[Render] IIFE executing for data rendering');
                        console.log('[Render] analyticsData state:', analyticsData);
                        console.log('[Render] Using data object:', data);
                        console.log('[Render] data.summary:', data?.summary);
                        console.log('[Render] data.trends.daily length:', data?.trends?.daily?.length);
                        console.log('[Render] data.distributions.mealTypes keys:', Object.keys(data?.distributions?.mealTypes || {}));
                        return (
                            <>
                    {/* Summary Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h6 className="card-title">Total Served</h6>
                                            <h2 className="display-4">{data.summary?.totalMealsServed || 0}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="bi bi-graph-up-arrow" style={{ fontSize: '2rem' }}></i>
                                        </div>
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
                                            <h2 className="display-4">{data.summary?.totalMealsPaused || 0}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="bi bi-pause-circle" style={{ fontSize: '2rem' }}></i>
                                        </div>
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
                                            <h2 className="display-4">{data.summary?.totalMealsResumed || 0}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="bi bi-play-circle" style={{ fontSize: '2rem' }}></i>
                                        </div>
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
                                            <h2 className="display-4">{data.summary?.pausePercentage?.toFixed(1) || 0}%</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="bi bi-percent" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Served vs Paused Trends</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px' }}>
                                        <Line
                                            data={{
                                                labels: data.trends?.daily?.map(d => {
                                                    const date = new Date(d.date);
                                                    return date.toLocaleDateString();
                                                }) || [],
                                                datasets: [
                                                    {
                                                        label: 'Meals Served',
                                                        data: data.trends?.daily?.map(d => d.served) || [],
                                                        borderColor: '#198754',
                                                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                                        fill: true,
                                                    },
                                                    {
                                                        label: 'Meals Paused',
                                                        data: data.trends?.daily?.map(d => d.paused) || [],
                                                        borderColor: '#ffc107',
                                                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                        fill: true,
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
                                                        text: 'Daily Food Service Trends'
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
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Meal Type Distribution</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px' }}>
                                        <Doughnut
                                            data={{
                                                labels: Object.keys(data.distributions?.mealTypes || {}),
                                                datasets: [{
                                                    data: Object.values(data.distributions?.mealTypes || {}).map(m => m.paused || 0),
                                                    backgroundColor: [
                                                        '#FF6384',
                                                        '#36A2EB',
                                                        '#FFCE56',
                                                        '#4BC0C0'
                                                    ],
                                                    borderWidth: 2
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

                    {/* Weekday Analysis */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Weekday Analysis</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px' }}>
                                        <Bar
                                            data={{
                                                labels: Object.keys(data.distributions?.weekdays || {}),
                                                datasets: [
                                                    {
                                                        label: 'Meals Served',
                                                        data: Object.values(data.distributions?.weekdays || {}).map(d => d.served || 0),
                                                        backgroundColor: 'rgba(25, 135, 84, 0.8)',
                                                        borderColor: '#198754',
                                                        borderWidth: 1
                                                    },
                                                    {
                                                        label: 'Meals Paused',
                                                        data: Object.values(data.distributions?.weekdays || {}).map(d => d.paused || 0),
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
                                                        text: 'Food Service by Day of Week'
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
                    </div>

                    {/* Daily Trends Table */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Custom Range Trends Details</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th className="text-end">Served</th>
                                                    <th className="text-end">Paused</th>
                                                    <th className="text-end">Resumed</th>
                                                    <th className="text-end">Pause Rate %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.trends?.daily && data.trends.daily.length > 0 ? (
                                                    data.trends.daily.map((day, index) => {
                                                        const total = (day.served || 0) + (day.paused || 0);
                                                        const pauseRate = total > 0 ? ((day.paused || 0) / total * 100).toFixed(1) : 0;
                                                        return (
                                                            <tr key={index}>
                                                                <td><strong>{new Date(day.date).toLocaleDateString()}</strong></td>
                                                                <td className="text-end"><span className="badge bg-success">{day.served || 0}</span></td>
                                                                <td className="text-end"><span className="badge bg-warning">{day.paused || 0}</span></td>
                                                                <td className="text-end"><span className="badge bg-info">{day.resumed || 0}</span></td>
                                                                <td className="text-end">
                                                                    <span className={`badge ${pauseRate > 20 ? 'bg-danger' : pauseRate > 10 ? 'bg-warning' : 'bg-success'}`}>
                                                                        {pauseRate}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted">No daily trend data available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meal Distribution Table */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-light">
                                    <h5 className="mb-0">Meal Distribution Details</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Meal Type</th>
                                                    <th className="text-end">Total Meals</th>
                                                    <th className="text-end">Paused</th>
                                                    <th className="text-end">Served</th>
                                                    <th className="text-end">Pause Rate %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.distributions?.mealTypes && Object.keys(data.distributions.mealTypes).length > 0 ? (
                                                    Object.entries(data.distributions.mealTypes).map(([mealType, mealItem]) => {
                                                        const total = (mealItem.paused || 0) + (mealItem.served || 0);
                                                        const pauseRate = total > 0 ? ((mealItem.paused || 0) / total * 100).toFixed(1) : 0;
                                                        return (
                                                            <tr key={mealType}>
                                                                <td><strong className="text-capitalize">{mealType}</strong></td>
                                                                <td className="text-end"><span className="badge bg-secondary">{total}</span></td>
                                                                <td className="text-end"><span className="badge bg-warning">{mealItem.paused || 0}</span></td>
                                                                <td className="text-end"><span className="badge bg-success">{mealItem.served || 0}</span></td>
                                                                <td className="text-end">
                                                                    <span className={`badge ${pauseRate > 20 ? 'bg-danger' : pauseRate > 10 ? 'bg-warning' : 'bg-success'}`}>
                                                                        {pauseRate}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted">No meal type data available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-calendar-date text-primary" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="card-title mt-2">Peak Pause Day</h6>
                                    <p className="mb-0 fw-bold">
                                        {data.summary?.peakPauseDay || 'No data'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-cup-hot text-warning" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="card-title mt-2">Most Paused Meal</h6>
                                    <p className="mb-0 fw-bold text-capitalize">
                                        {data.summary?.peakPauseMeal || 'No data'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-light h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-person text-info" style={{ fontSize: '2rem' }}></i>
                                    <h6 className="card-title mt-2">Avg Pauses/Student</h6>
                                    <p className="mb-0 fw-bold">
                                        {data.summary?.averagePausesPerStudent?.toFixed(1) || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Insights Section */}
                    <div className="card">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-lightbulb me-2"></i>
                                Automated Insights
                            </h5>
                        </div>
                        <div className="card-body">
                            {data.insights && data.insights.length > 0 ? (
                                <div className="row">
                                    {data.insights.map((insight, index) => (
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
                        </>);
                    })()}
                </div>
            )}
        </div>
    );
};

export default FoodAnalytics;

