import { useState, useEffect } from 'react';
import axios from 'axios';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const FoodPauseManagerEnhanced = ({ outpassData = null }) => {
    const { user } = useCurrentUser();
    const [activeTab, setActiveTab] = useState('pause');
    const [pausedMeals, setPausedMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [pauseType, setPauseType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [todayDate, setTodayDate] = useState('');
    const [tomorrowDate, setTomorrowDate] = useState('');

    useEffect(() => {
        if (user?.rollNumber) {
            fetchPausedMeals();
        }
    }, [user?.rollNumber]);

    useEffect(() => {
        // Initialize today and tomorrow dates when component mounts
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tYear = tomorrow.getFullYear();
        const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const tDay = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;
        
        setTodayDate(todayStr);
        setTomorrowDate(tomorrowStr);
    }, []);

    useEffect(() => {
        // Pre-fill from outpass data if provided
        if (outpassData) {
            setPauseType('custom');
            setStartDate(outpassData.outTime.split('T')[0]);
            setEndDate(outpassData.inTime.split('T')[0]);
            setStep(2);
        }
    }, [outpassData]);

    const mealTimings = {
        breakfast: { start: "07:00", editDeadline: "05:00" },
        lunch: { start: "12:30", editDeadline: "10:30" },
        snacks: { start: "16:30", editDeadline: "14:30" },
        dinner: { start: "19:30", editDeadline: "17:30" }
    };

    const fetchPausedMeals = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/my-pauses?studentId=${user.rollNumber}`);
            setPausedMeals(response.data);
        } catch (error) {
            console.error('Error fetching paused meals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePauseTypeSelect = (type) => {
        setPauseType(type);

        switch (type) {
            case 'today': {
                // Calculate today's date locally in case state isn't initialized yet
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const today = `${y}-${m}-${d}`;
                console.log(`[Pause Manager] Selected 'today': ${today} (from state: ${todayDate})`);
                setStartDate(today);
                setEndDate(today);
                break;
            }
            case 'tomorrow': {
                // Calculate tomorrow's date locally in case state isn't initialized yet
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const y = tomorrow.getFullYear();
                const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const d = String(tomorrow.getDate()).padStart(2, '0');
                const tmr = `${y}-${m}-${d}`;
                console.log(`[Pause Manager] Selected 'tomorrow': ${tmr} (from state: ${tomorrowDate})`);
                setStartDate(tmr);
                setEndDate(tmr);
                break;
            }
            case 'custom':
                setStartDate('');
                setEndDate('');
                break;
        }
        setStep(2);
    };

    const handleMealToggle = (meal) => {
        setSelectedMeals(prev => 
            prev.includes(meal) 
                ? prev.filter(m => m !== meal)
                : [...prev, meal]
        );
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            
            const pauseData = {
                studentId: user.rollNumber,
                meals: selectedMeals,
                pauseType,
                startDate,
                endDate,
                outpassId: outpassData?._id || null
            };

            console.log(`[Pause Submit] About to send pause creation request`);
            console.log(`[Pause Submit] pauseType: ${pauseType}`);
            console.log(`[Pause Submit] startDate state: "${startDate}" (todayDate="${todayDate}", tomorrowDate="${tomorrowDate}")`);
            console.log(`[Pause Submit] endDate state: "${endDate}"`);
            console.log(`[Pause Submit] Full payload:`, pauseData);
            
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause`, pauseData);
            
            setMessage({ type: 'success', text: 'Food pause created successfully!' });
            fetchPausedMeals();
            resetForm();
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Failed to create pause. Please try again.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelPause = async (pauseId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause/${pauseId}`);
            setMessage({ type: 'success', text: 'Pause cancelled successfully!' });
            fetchPausedMeals();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to cancel pause.' });
        }
    };

    const resetForm = () => {
        setStep(1);
        setPauseType('');
        setStartDate('');
        setEndDate('');
        setSelectedMeals([]);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const canEditMeal = (meal, pauseDate) => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        // Get current date in local timezone (not UTC)
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        if (pauseDate === currentDate) {
            return currentTime < mealTimings[meal].editDeadline;
        }
        return pauseDate > currentDate;
    };

    const categorizesPauses = () => {
        // Get current date in local timezone (not UTC)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        return {
            active: pausedMeals.filter(p => p.pause_start_date <= currentDate && p.pause_end_date >= currentDate && p.is_active),
            upcoming: pausedMeals.filter(p => p.pause_start_date > currentDate && p.is_active),
            past: pausedMeals.filter(p => p.pause_end_date < currentDate || !p.is_active)
        };
    };

    // Check if a pause can still be edited (end date hasn't passed)
    const canEditPause = (pauseEndDate) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        // Can edit if pause end date is today or in the future
        return pauseEndDate >= currentDate;
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading food pause data...</p>
            </div>
        );
    }

    const { active, upcoming, past } = categorizesPauses();

    return (
        <div className="food-pause-manager">
            {/* Header */}
            <div className="mb-4">
                <div className="card border-0 shadow-sm">
                    <div className="card-body bg-gradient-primary text-white rounded">
                        <div className="d-flex align-items-center">
                            <div className="me-3">
                                <i className="bi bi-pause-circle-fill" style={{ fontSize: '2.5rem' }}></i>
                            </div>
                            <div>
                                <h3 className="mb-1">Smart Food Pause Management</h3>
                                <p className="mb-0 opacity-75">
                                    {outpassData ? 'Complete your food pause for approved outpass' : 'Manage your meal schedules efficiently'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`}>
                    <i className={`bi bi-${message.type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2`}></i>
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light border-0">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'pause' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pause')}
                                style={{ color: activeTab === 'pause' ? '#0c63e4' : '#333' }}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Pause Meals
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
                                onClick={() => setActiveTab('manage')}
                                style={{ color: activeTab === 'manage' ? '#0c63e4' : '#333' }}
                            >
                                <i className="bi bi-list-check me-2"></i>
                                My Paused Meals
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="card-body p-4">
                    {activeTab === 'pause' && (
                        <div>
                            {step === 1 && (
                                <div>
                                    <div className="text-center mb-4">
                                        <h4 className="text-primary mb-2">When do you want to pause meals?</h4>
                                        <p className="text-muted">Choose from flexible pause options</p>
                                    </div>
                                    
                                    <div className="row g-4 justify-content-center">
                                        <div className="col-md-4">
                                            <div 
                                                className="card h-100 pause-option border-2 border-primary"
                                                onClick={() => handlePauseTypeSelect('today')}
                                            >
                                                <div className="card-body text-center p-4">
                                                    <i className="bi bi-calendar-day text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                                                    <h5 className="card-title text-primary">Today Only</h5>
                                                    <p className="card-text text-muted">Pause meals for today</p>
                                                    <small className="text-warning">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Check meal deadlines
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-4">
                                            <div 
                                                className="card h-100 pause-option border-2 border-success"
                                                onClick={() => handlePauseTypeSelect('tomorrow')}
                                            >
                                                <div className="card-body text-center p-4">
                                                    <i className="bi bi-calendar-plus text-success mb-3" style={{ fontSize: '3rem' }}></i>
                                                    <h5 className="card-title text-success">Tomorrow Only</h5>
                                                    <p className="card-text text-muted">Perfect for late passes</p>
                                                    <small className="text-success">
                                                        <i className="bi bi-check-circle me-1"></i>
                                                        Full editing available
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-4">
                                            <div 
                                                className="card h-100 pause-option border-2 border-warning"
                                                onClick={() => handlePauseTypeSelect('custom')}
                                            >
                                                <div className="card-body text-center p-4">
                                                    <i className="bi bi-calendar-range text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                                                    <h5 className="card-title text-warning">Custom Date Range</h5>
                                                    <p className="card-text text-muted">Choose start and end dates</p>
                                                    <small className="text-info">
                                                        <i className="bi bi-calendar-event me-1"></i>
                                                        Flexible duration
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="text-primary mb-0">Configure Meal Pause</h4>
                                        {!outpassData && (
                                            <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                                                <i className="bi bi-arrow-left me-1"></i>Back
                                            </button>
                                        )}
                                    </div>

                                    {pauseType === 'custom' && (
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control form-control-lg"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    min={today}
                                                    disabled={!!outpassData}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">End Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control form-control-lg"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    min={startDate}
                                                    disabled={!!outpassData}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {startDate && endDate && (
                                        <div>
                                            <div className="card bg-light border-0 mb-4">
                                                <div className="card-body">
                                                    <h5 className="text-primary mb-3">
                                                        <i className="bi bi-calendar-check me-2"></i>
                                                        Pause Period: {formatDate(startDate)} 
                                                        {startDate !== endDate && ` to ${formatDate(endDate)}`}
                                                    </h5>
                                                    {outpassData && (
                                                        <p className="text-info mb-0">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            Pre-filled from your approved outpass
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <h5 className="mb-3">Select Meals to Pause</h5>
                                            <div className="row g-3 mb-4">
                                                {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => {
                                                    const isSelected = selectedMeals.includes(meal);
                                                    
                                                    return (
                                                        <div key={meal} className="col-md-6">
                                                            <div 
                                                                className={`card h-100 meal-card ${isSelected ? 'border-danger bg-danger bg-opacity-10' : 'border-success'}`}
                                                                onClick={() => handleMealToggle(meal)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="card-body text-center p-3">
                                                                    <i className={`bi bi-${meal === 'breakfast' ? 'cup-hot' : meal === 'lunch' ? 'bowl' : meal === 'snacks' ? 'cookie' : 'moon'} ${isSelected ? 'text-danger' : 'text-success'} mb-2`} style={{ fontSize: '2rem' }}></i>
                                                                    <h6 className={`card-title text-capitalize ${isSelected ? 'text-danger' : 'text-success'}`}>
                                                                        {meal}
                                                                    </h6>
                                                                    <p className="card-text small text-muted mb-2">
                                                                        {mealTimings[meal].start}
                                                                    </p>
                                                                    {isSelected && (
                                                                        <span className="badge bg-danger">
                                                                            <i className="bi bi-pause-fill me-1"></i>
                                                                            SELECTED
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="d-flex gap-4 justify-content-center mb-4">
                                            </div>

                                            <div className="mt-5 text-center">
                                                <button
                                                    className="btn me-4"
                                                    onClick={handleSubmit}
                                                    disabled={submitting || selectedMeals.length === 0}
                                                    style={{
                                                        background: selectedMeals.length === 0 
                                                            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                                                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '20px',
                                                        fontWeight: '800',
                                                        fontSize: '1.3rem',
                                                        padding: '15px 40px',
                                                        boxShadow: selectedMeals.length === 0 
                                                            ? '0 10px 25px rgba(156, 163, 175, 0.4)' 
                                                            : '0 10px 25px rgba(139, 92, 246, 0.5)',
                                                        transition: 'all 0.4s ease',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        cursor: selectedMeals.length === 0 ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!e.target.disabled && selectedMeals.length > 0) {
                                                            e.target.style.transform = 'translateY(-5px) scale(1.08)';
                                                            e.target.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.7)';
                                                            e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!e.target.disabled) {
                                                            e.target.style.transform = 'translateY(0) scale(1)';
                                                            e.target.style.boxShadow = selectedMeals.length === 0 
                                                                ? '0 10px 25px rgba(156, 163, 175, 0.4)' 
                                                                : '0 10px 25px rgba(139, 92, 246, 0.5)';
                                                            e.target.style.background = selectedMeals.length === 0 
                                                                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                                                                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                                                        }
                                                    }}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>
                                                            PROCESSING...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-pause-fill me-3" style={{ fontSize: '1.4rem' }}></i>
                                                            PAUSE MEALS
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div>
                            <h4 className="text-primary mb-4">My Paused Meals</h4>
                            
                            {/* Active Pauses */}
                            {active.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-success mb-3">
                                        <i className="bi bi-pause-circle me-2"></i>
                                        Currently Active ({active.length})
                                    </h5>
                                    <div className="row g-3">
                                        {active.map(pause => (
                                            <div key={pause._id} className="col-md-6">
                                                <div className="card border-success">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="text-capitalize text-success">
                                                                    <i className="bi bi-pause-fill me-1"></i>
                                                                    {pause.meal_type}
                                                                </h6>
                                                                <p className="small text-muted mb-1">
                                                                    {formatDate(pause.pause_start_date)}
                                                                    {pause.pause_start_date !== pause.pause_end_date && 
                                                                        ` to ${formatDate(pause.pause_end_date)}`
                                                                    }
                                                                </p>
                                                                <span className="badge bg-success">Active</span>
                                                            </div>
                                                            {canEditPause(pause.pause_end_date) && (
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    onClick={() => handleCancelPause(pause._id)}
                                                                >
                                                                    <i className="bi bi-x-circle"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Pauses */}
                            {upcoming.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-primary mb-3">
                                        <i className="bi bi-calendar-event me-2"></i>
                                        Upcoming ({upcoming.length})
                                    </h5>
                                    <div className="row g-3">
                                        {upcoming.map(pause => (
                                            <div key={pause._id} className="col-md-6">
                                                <div className="card border-primary">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="text-capitalize text-primary">
                                                                    <i className="bi bi-clock me-1"></i>
                                                                    {pause.meal_type}
                                                                </h6>
                                                                <p className="small text-muted mb-1">
                                                                    {formatDate(pause.pause_start_date)}
                                                                    {pause.pause_start_date !== pause.pause_end_date && 
                                                                        ` to ${formatDate(pause.pause_end_date)}`
                                                                    }
                                                                </p>
                                                                <span className="badge bg-primary">Upcoming</span>
                                                            </div>
                                                            {canEditPause(pause.pause_end_date) && (
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    onClick={() => handleCancelPause(pause._id)}
                                                                >
                                                                    <i className="bi bi-x-circle"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Past Pauses */}
                            {past.length > 0 && (
                                <div>
                                    <h5 className="text-muted mb-3">
                                        <i className="bi bi-archive me-2"></i>
                                        Past Pauses ({past.length})
                                    </h5>
                                    <div className="row g-3">
                                        {past.slice(0, 6).map(pause => (
                                            <div key={pause._id} className="col-md-6">
                                                <div className="card border-light bg-light">
                                                    <div className="card-body">
                                                        <h6 className="text-capitalize text-muted">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            {pause.meal_type}
                                                        </h6>
                                                        <p className="small text-muted mb-1">
                                                            {formatDate(pause.pause_start_date)}
                                                            {pause.pause_start_date !== pause.pause_end_date && 
                                                                ` to ${formatDate(pause.pause_end_date)}`
                                                            }
                                                        </p>
                                                        <span className="badge bg-secondary">
                                                            {pause.is_active ? 'Completed' : 'Cancelled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {active.length === 0 && upcoming.length === 0 && past.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                                    <h5 className="text-muted mt-3">No paused meals found</h5>
                                    <p className="text-muted">Start by pausing some meals from the "Pause Meals" tab</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                }
                
                .pause-option {
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .pause-option:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                
                .meal-card {
                    transition: all 0.2s ease;
                    border: 2px solid;
                }
                
                .meal-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .card {
                    border-radius: 12px;
                }
                
                .btn {
                    border-radius: 8px;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default FoodPauseManagerEnhanced;
