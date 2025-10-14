import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';

const FoodCountManager = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState('daily');
    const [weeklyStats, setWeeklyStats] = useState({});
    const { token } = useAdmin();

    // Helper to get tomorrow's date in YYYY-MM-DD format
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Helper to get today's date
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Helper to get week dates (7 days starting from today)
    const getWeekDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    const fetchDailyStats = async (date) => {
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/food-count/calculate`, {
                date,
                hostelId: 1 // This should come from admin context
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setStats(response.data);
        } catch (err) {
            setError('Failed to fetch food count. Please try again.');
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyStats = async () => {
        setLoading(true);
        setError('');
        
        try {
            const weekDates = getWeekDates();
            const promises = weekDates.map(date =>
                axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/food-count/calculate`, {
                    date,
                    hostelId: 1 // This should come from admin context
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            );
            
            const responses = await Promise.all(promises);
            const weeklyData = {};
            
            weekDates.forEach((date, index) => {
                weeklyData[date] = responses[index].data;
            });
            
            setWeeklyStats(weeklyData);
        } catch (err) {
            setError('Failed to fetch weekly data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Set tomorrow as default date on component mount
    useEffect(() => {
        const tomorrow = getTomorrowDate();
        setSelectedDate(tomorrow);
        fetchDailyStats(tomorrow);
    }, []);

    // Handle view change
    useEffect(() => {
        if (view === 'weekly') {
            fetchWeeklyStats();
        } else if (selectedDate) {
            fetchDailyStats(selectedDate);
        }
    }, [view]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (view === 'daily') {
            fetchDailyStats(date);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const isToday = (dateString) => {
        return dateString === getTodayDate();
    };

    const isTomorrow = (dateString) => {
        return dateString === getTomorrowDate();
    };

    return (
        <div className="food-count-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>🍽️ Food Count Management</h4>
                <div className="btn-group">
                    <button
                        className={`btn ${view === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setView('daily')}
                    >
                        Daily View
                    </button>
                    <button
                        className={`btn ${view === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setView('weekly')}
                    >
                        Weekly View
                    </button>
                </div>
            </div>

            {view === 'daily' && (
                <div className="row mb-3">
                    <div className="col-md-8">
                        <div className="btn-group me-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => handleDateChange(getTodayDate())}
                            >
                                Today
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => handleDateChange(getTomorrowDate())}
                            >
                                Tomorrow
                            </button>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="form-control d-inline-block"
                            style={{ width: 'auto' }}
                        />
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading food count...</p>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {view === 'daily' && stats && (
                <div className="daily-view">
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                {formatDate(selectedDate)}
                                {isToday(selectedDate) && <span className="badge bg-warning text-dark ms-2">Today</span>}
                                {isTomorrow(selectedDate) && <span className="badge bg-info ms-2">Tomorrow</span>}
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <div className="card bg-light h-100">
                                        <div className="card-body text-center">
                                            <div className="display-1 mb-2">🍳</div>
                                            <h5>Breakfast</h5>
                                            <h3 className="text-primary">{stats.breakfast}</h3>
                                            <small className="text-muted">7:00 - 9:00 AM</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-light h-100">
                                        <div className="card-body text-center">
                                            <div className="display-1 mb-2">🍛</div>
                                            <h5>Lunch</h5>
                                            <h3 className="text-success">{stats.lunch}</h3>
                                            <small className="text-muted">12:00 - 2:00 PM</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-light h-100">
                                        <div className="card-body text-center">
                                            <div className="display-1 mb-2">☕</div>
                                            <h5>Snacks</h5>
                                            <h3 className="text-warning">{stats.snacks}</h3>
                                            <small className="text-muted">4:00 - 6:00 PM</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="card bg-light h-100">
                                        <div className="card-body text-center">
                                            <div className="display-1 mb-2">🍽️</div>
                                            <h5>Dinner</h5>
                                            <h3 className="text-info">{stats.dinner}</h3>
                                            <small className="text-muted">7:00 - 9:00 PM</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <button className="btn btn-primary me-2">
                                    <i className="bi bi-envelope me-2"></i>Email to Kitchen
                                </button>
                                <button className="btn btn-outline-secondary">
                                    <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'weekly' && Object.keys(weeklyStats).length > 0 && (
                <div className="weekly-view">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Weekly Food Count Overview</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {getWeekDates().map((date) => (
                                    <div key={date} className="col-lg-3 col-md-4 col-sm-6">
                                        <div className="card bg-light h-100">
                                            <div className="card-header bg-secondary text-white text-center">
                                                <h6 className="mb-0">
                                                    {formatDate(date)}
                                                    {isToday(date) && <span className="badge bg-warning text-dark ms-1">Today</span>}
                                                    {isTomorrow(date) && <span className="badge bg-info ms-1">Tomorrow</span>}
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row text-center">
                                                    <div className="col-6 mb-2">
                                                        <div>🍳</div>
                                                        <strong>{weeklyStats[date]?.breakfast || 0}</strong>
                                                    </div>
                                                    <div className="col-6 mb-2">
                                                        <div>🍛</div>
                                                        <strong>{weeklyStats[date]?.lunch || 0}</strong>
                                                    </div>
                                                    <div className="col-6">
                                                        <div>☕</div>
                                                        <strong>{weeklyStats[date]?.snacks || 0}</strong>
                                                    </div>
                                                    <div className="col-6">
                                                        <div>🍽️</div>
                                                        <strong>{weeklyStats[date]?.dinner || 0}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodCountManager;
