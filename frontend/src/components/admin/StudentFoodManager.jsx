import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';
import FoodAnalytics from './FoodAnalyticsFixed';

const StudentFoodManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        date: '',
        summary: {
            totalStudents: 0,
            availableStudents: 0,
            totalStudentsWithPause: 0,
            studentsTakingMeals: 0,
            totalMealsAvailable: 0,
            totalMealsPaused: 0,
            totalMealsServed: 0,
            pausePercentage: 0
        },
        mealWiseStats: {
            breakfast: { paused: 0, available: 0, served: 0, students: [] },
            lunch: { paused: 0, available: 0, served: 0, students: [] },
            snacks: { paused: 0, available: 0, served: 0, students: [] },
            dinner: { paused: 0, available: 0, served: 0, students: [] }
        },
        statusDistribution: {},
        allPauses: []
    });
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
            setStats(response.data);
            setError('');
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

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="student-food-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4>👥 Student Food Management</h4>
                    <small className="text-muted">Date: {stats.date}</small>
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
                                style={{ color: activeTab === 'overview' ? '#0c63e4' : '#333' }}
                            >
                                <i className="bi bi-speedometer2 me-2"></i>
                                Overview
                            </button>
                        </li>
                        
                        {/* <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                                style={{ color: activeTab === 'analytics' ? '#0c63e4' : '#333' }}
                            >
                                <i className="bi bi-graph-up me-2"></i>
                                Analytics Dashboard
                            </button>
                        </li> */}
                    </ul>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Summary Statistics Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title">Total Students</h6>
                                    <h3 className="mb-0">{stats.summary.totalStudents}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-success text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title">Taking Meals</h6>
                                    <h3 className="mb-0">{stats.summary.studentsTakingMeals}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-warning text-dark h-100">
                                <div className="card-body">
                                    <h6 className="card-title">With Pauses</h6>
                                    <h3 className="mb-0">{stats.summary.totalStudentsWithPause}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-info text-white h-100">
                                <div className="card-body">
                                    <h6 className="card-title">Total Meals Paused</h6>
                                    <h3 className="mb-0">{stats.summary.totalMealsPaused}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meal-Wise Pause Statistics */}
                    <div className="row g-3">
                        <div className="col-md-6 col-lg-3">
                            <div className="card border-warning h-100">
                                <div className="card-body">
                                    <h6 className="card-title text-warning">Breakfast Paused</h6>
                                    <h3 className="mb-1 text-warning">{stats.mealWiseStats.breakfast.paused}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="card border-info h-100">
                                <div className="card-body">
                                    <h6 className="card-title text-info">Lunch Paused</h6>
                                    <h3 className="mb-1 text-info">{stats.mealWiseStats.lunch.paused}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="card border-success h-100">
                                <div className="card-body">
                                    <h6 className="card-title text-success">Snacks Paused</h6>
                                    <h3 className="mb-1 text-success">{stats.mealWiseStats.snacks.paused}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <div className="card border-danger h-100">
                                <div className="card-body">
                                    <h6 className="card-title text-danger">Dinner Paused</h6>
                                    <h3 className="mb-1 text-danger">{stats.mealWiseStats.dinner.paused}</h3>
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
