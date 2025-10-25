import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';

const FoodAnalyticsTest = () => {
    const { token } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        dateFilter: 'thisMonth',
        customStartDate: '',
        customEndDate: '',
        mealTypes: 'all'
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, [filters, token]);

    const fetchAnalyticsData = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            setError(null);
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
                setError('No analytics data available');
            }
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            setError(error.response?.data?.message || 'Failed to fetch analytics data');
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
            <div className="alert alert-success mb-4">
                <h4><i className="bi bi-graph-up me-2"></i>Food Analytics Dashboard (Test Version)</h4>
                <p className="mb-0">This is a simplified test version to verify the component loads correctly.</p>
            </div>

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
                            </select>
                        </div>
                        
                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-info"
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="alert alert-danger">
                    <h6><i className="bi bi-exclamation-triangle me-2"></i>Error</h6>
                    <p className="mb-0">{error}</p>
                </div>
            )}

            {/* Analytics Data Display */}
            {analyticsData ? (
                <div>
                    <div className="alert alert-info">
                        <h6><i className="bi bi-info-circle me-2"></i>Analytics Data Found</h6>
                        <p className="mb-0">Successfully loaded analytics data!</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-graph-up-arrow display-4 mb-3"></i>
                                    <h5 className="card-title">Total Served</h5>
                                    <h2 className="display-4">{analyticsData.summary?.totalMealsServed || 0}</h2>
                                    <small>Meals served</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-warning text-white h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-pause-circle display-4 mb-3"></i>
                                    <h5 className="card-title">Total Paused</h5>
                                    <h2 className="display-4">{analyticsData.summary?.totalMealsPaused || 0}</h2>
                                    <small>Meals paused</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-success text-white h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-play-circle display-4 mb-3"></i>
                                    <h5 className="card-title">Total Resumed</h5>
                                    <h2 className="display-4">{analyticsData.summary?.totalMealsResumed || 0}</h2>
                                    <small>Meals resumed</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-info text-white h-100">
                                <div className="card-body text-center">
                                    <i className="bi bi-percent display-4 mb-3"></i>
                                    <h5 className="card-title">Pause Rate</h5>
                                    <h2 className="display-4">{analyticsData.summary?.pausePercentage?.toFixed(1) || 0}%</h2>
                                    <small>Current rate</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raw Data Display */}
                    <div className="card">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">Raw Analytics Data</h5>
                        </div>
                        <div className="card-body">
                            <pre className="bg-light p-3 rounded" style={{ fontSize: '0.8rem', maxHeight: '400px', overflow: 'auto' }}>
                                {JSON.stringify(analyticsData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="alert alert-warning">
                    <h6><i className="bi bi-exclamation-triangle me-2"></i>No Data</h6>
                    <p className="mb-0">No analytics data available. Try clicking "Debug Data" to check if food pause records exist.</p>
                </div>
            )}
        </div>
    );
};

export default FoodAnalyticsTest;
