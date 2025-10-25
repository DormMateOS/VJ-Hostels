import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';
import FoodAnalytics from './FoodAnalyticsFixed';

const StudentFoodManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalMealsToday: 0, breakfastPaused: 0, lunchPaused: 0, snacksPaused: 0, dinnerPaused: 0 });
    const { token } = useAdmin();

    useEffect(() => {
        fetchFoodStats();
    }, []);

    
    const fetchFoodStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/food/stats/today`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Food Stats Response:', response.data);
            setStats(response.data);
            
        } catch (err) {
            console.error('Error fetching food stats:', err);
            setError(`Failed to fetch food stats: ${err.response?.data?.error || err.message}`);
        }
        setLoading(false);
    };


    if (loading) {
        return (
            <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="student-food-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4>👥 Student Food Management</h4>
                </div>
                
                {activeTab === 'overview' && (
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-primary"
                            onClick={fetchFoodStats}
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh Data
                        </button>
                        <button 
                            className="btn btn-info"
                            onClick={async () => {
                                try {
                                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/debug/food-pauses`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    console.log('Food Pause Debug:', response.data);
                                    alert(`Found ${response.data.total} total food pause records, ${response.data.active} active today. Check console for details.`);
                                } catch (error) {
                                    console.error('Debug error:', error);
                                    alert('Error fetching debug data');
                                }
                            }}
                        >
                            <i className="bi bi-bug me-2"></i>
                            Debug Food Pauses
                        </button>
                        <button 
                            className="btn btn-success"
                            onClick={async () => {
                                try {
                                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/analytics/dashboard-data?dateFilter=thisMonth`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    console.log('Analytics API Response:', response.data);
                                    const data = response.data.data;
                                    alert(`Analytics Data: ${data.summary.totalMealsPaused} paused, ${data.summary.totalMealsServed} served, ${data.trends.daily.length} days of data. Check console for full details.`);
                                } catch (error) {
                                    console.error('Analytics error:', error);
                                    alert('Error fetching analytics data');
                                }
                            }}
                        >
                            <i className="bi bi-graph-up me-2"></i>
                            Test Analytics API
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="card mb-4">
                <div className="card-header">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <i className="bi bi-speedometer2 me-2"></i>
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                <i className="bi bi-graph-up me-2"></i>
                                Analytics Dashboard
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Statistics Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title">Today's strength</h6>
                                    <h3 className="mb-0">{stats.totalMealsToday}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-8">
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <div className="card bg-warning text-dark h-100">
                                        <div className="card-body">
                                            <h6 className="card-title">breakfast Paused</h6>
                                            <h3 className="mb-0">{stats.breakfastPaused}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card bg-warning text-dark h-100">
                                        <div className="card-body">
                                            <h6 className="card-title">Lunch Paused</h6>
                                            <h3 className="mb-0">{stats.lunchPaused}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card bg-warning text-dark h-100">
                                        <div className="card-body">
                                            <h6 className="card-title">Snacks Paused</h6>
                                            <h3 className="mb-0">{stats.snacksPaused}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="card bg-warning text-dark h-100">
                                        <div className="card-body">
                                            <h6 className="card-title">Dinner Paused</h6>
                                            <h3 className="mb-0">{stats.dinnerPaused}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <FoodAnalytics />
            )}
        </div>
    );
};

export default StudentFoodManager;
