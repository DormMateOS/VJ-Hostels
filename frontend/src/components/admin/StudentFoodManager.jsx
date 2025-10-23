import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';

const StudentFoodManager = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalMealsToday: 0, breakfastPaused: 0, lunchPaused: 0, snacksPaused: 0, dinnerPaused: 0 });
    const { token } = useAdmin();

    useEffect(() => {
        fetchFoodStats();
    }, []);

    
    const fetchFoodStats = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/food/stats/today`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
                
                <button 
                    onClick={fetchFoodStats} 
                    className="btn btn-outline-primary"
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

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
    );
};

export default StudentFoodManager;
