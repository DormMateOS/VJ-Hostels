import { useState, useEffect } from 'react';
import axios from 'axios';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const FoodPauseManagerNew = () => {
    const { user } = useCurrentUser();
    const [currentStatus, setCurrentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [pauseType, setPauseType] = useState('');
    const [pauseDate, setPauseDate] = useState('');
    const [pauseMeals, setPauseMeals] = useState([]);
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Meal timings for edit validation (2 hours before meal)
    const mealTimings = {
        breakfast: { start: "07:00", editDeadline: "05:00" },
        lunch: { start: "12:30", editDeadline: "10:30" },
        snacks: { start: "16:30", editDeadline: "14:30" },
        dinner: { start: "19:30", editDeadline: "17:30" }
    };

    useEffect(() => {
        if (user?.rollNumber) {
            fetchCurrentStatus();
        }
    }, [user?.rollNumber]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchCurrentStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/student-status?studentId=${user.rollNumber}`);
            setCurrentStatus(response.data);
            
            // If user has existing pause, set up for editing
            if (response.data?.pause_from) {
                setIsEditing(true);
                setPauseDate(response.data.pause_from);
                setPauseMeals(response.data.pause_meals ? response.data.pause_meals.split(',') : []);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEditMeal = (meal) => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const currentDate = now.toISOString().split('T')[0];
        
        // If pause is for today, check if we're within edit window
        if (pauseDate === currentDate) {
            return currentTime < mealTimings[meal].editDeadline;
        }
        
        // If pause is for future date, allow editing
        return pauseDate > currentDate;
    };

    const handlePauseTypeSelect = (type) => {
        setPauseType(type);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        switch (type) {
            case 'today':
                setPauseDate(today.toISOString().split('T')[0]);
                break;
            case 'tomorrow':
                setPauseDate(tomorrow.toISOString().split('T')[0]);
                break;
            case 'custom':
                setPauseDate('');
                break;
        }
        setStep(2);
    };

    const handleMealToggle = (meal) => {
        if (!canEditMeal(meal) && isEditing) {
            setMessage({ 
                type: 'error', 
                text: `Cannot edit ${meal} - deadline passed (2 hours before meal time)` 
            });
            return;
        }

        setPauseMeals(prev => 
            prev.includes(meal) 
                ? prev.filter(m => m !== meal)
                : [...prev, meal]
        );
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            
            const data = {
                studentId: user.rollNumber,
                pause_from: pauseDate,
                pause_meals: pauseMeals.join(','),
                resume_from: null, // Single day pause only
                resume_meals: null
            };

            const endpoint = isEditing ? 'edit-pause' : 'pause';
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/${endpoint}`, data);
            
            setMessage({ 
                type: 'success', 
                text: isEditing ? 'Food pause updated successfully!' : 'Food pause created successfully!' 
            });
            fetchCurrentStatus();
            resetForm();
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Failed to update food service. Please try again.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelPause = async () => {
        try {
            setSubmitting(true);
            await axios.delete(`${import.meta.env.VITE_SERVER_URL}/food-api/cancel-pause/${user.rollNumber}`);
            setMessage({ type: 'success', text: 'Food pause cancelled successfully!' });
            fetchCurrentStatus();
            resetForm();
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Failed to cancel pause.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setPauseType('');
        setPauseDate('');
        setPauseMeals([]);
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMealStatusColor = (meal) => {
        if (currentStatus?.pause_meals?.includes(meal)) {
            return 'text-danger fw-bold'; // Red for paused meals
        }
        return 'text-success';
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your food status...</p>
            </div>
        );
    }

    return (
        <div className="food-pause-manager">
            {/* Header Section */}
            <div className="mb-4">
                <div className="card border-0 shadow-sm">
                    <div className="card-body bg-gradient-primary text-white rounded">
                        <div className="d-flex align-items-center">
                            <div className="me-3">
                                <i className="bi bi-pause-circle-fill" style={{ fontSize: '2.5rem' }}></i>
                            </div>
                            <div>
                                <h3 className="mb-1">Food Service Management</h3>
                                <p className="mb-0 opacity-75">
                                    Welcome, {user?.name}! Don't forget to rate your finished meals.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : 'info'} alert-dismissible fade show`} role="alert">
                    <i className={`bi bi-${message.type === 'error' ? 'exclamation-triangle' : message.type === 'success' ? 'check-circle' : 'info-circle'} me-2`}></i>
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                </div>
            )}

            {/* Current Status Display */}
            {currentStatus?.pause_from && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-light border-0">
                        <h5 className="mb-0">
                            <i className="bi bi-info-circle me-2 text-primary"></i>
                            Current Pause Status
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <p className="mb-2">
                                    <strong>Pause Date:</strong> {formatDate(currentStatus.pause_from)}
                                </p>
                                <p className="mb-0">
                                    <strong>Paused Meals:</strong> 
                                    {currentStatus.pause_meals ? (
                                        <span className="ms-2">
                                            {currentStatus.pause_meals.split(',').map(meal => (
                                                <span key={meal} className="badge bg-danger me-1 text-capitalize">
                                                    {meal}
                                                </span>
                                            ))}
                                        </span>
                                    ) : (
                                        <span className="text-muted ms-2">None</span>
                                    )}
                                </p>
                            </div>
                            <div className="col-md-4 text-end">
                                <button 
                                    className="btn btn-outline-primary me-2"
                                    onClick={() => {
                                        setIsEditing(true);
                                        setStep(2);
                                        setPauseDate(currentStatus.pause_from);
                                        setPauseMeals(currentStatus.pause_meals ? currentStatus.pause_meals.split(',') : []);
                                    }}
                                >
                                    <i className="bi bi-pencil me-1"></i>
                                    Edit
                                </button>
                                <button 
                                    className="btn btn-outline-danger"
                                    onClick={handleCancelPause}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-x-circle me-1"></i>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    {!currentStatus?.pause_from && step === 1 && (
                        <div>
                            <div className="text-center mb-4">
                                <h4 className="text-primary mb-2">When do you want to pause your food service?</h4>
                                <p className="text-muted">You can pause meals for a single day and edit up to 2 hours before meal time</p>
                            </div>
                            
                            <div className="row g-4 justify-content-center">
                                <div className="col-md-4">
                                    <div 
                                        className="card h-100 pause-option border-2 border-primary"
                                        onClick={() => handlePauseTypeSelect('today')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i className="bi bi-calendar-day text-primary" style={{ fontSize: '3rem' }}></i>
                                            </div>
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
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i className="bi bi-calendar-plus text-success" style={{ fontSize: '3rem' }}></i>
                                            </div>
                                            <h5 className="card-title text-success">Tomorrow Only</h5>
                                            <p className="card-text text-muted">Pause meals for tomorrow</p>
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
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i className="bi bi-calendar-range text-warning" style={{ fontSize: '3rem' }}></i>
                                            </div>
                                            <h5 className="card-title text-warning">Custom Date</h5>
                                            <p className="card-text text-muted">Choose your own date</p>
                                            <small className="text-info">
                                                <i className="bi bi-calendar-event me-1"></i>
                                                Select any future date
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
                                <h4 className="text-primary mb-0">
                                    {isEditing ? 'Edit Food Pause' : 'Configure Food Pause'}
                                </h4>
                                {!isEditing && (
                                    <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                                        <i className="bi bi-arrow-left me-1"></i>Back
                                    </button>
                                )}
                            </div>

                            {pauseType === 'custom' && !isEditing && (
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Select Date</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg"
                                        value={pauseDate}
                                        onChange={(e) => setPauseDate(e.target.value)}
                                        min={today}
                                    />
                                </div>
                            )}

                            {pauseDate && (
                                <div>
                                    <div className="card bg-light border-0 mb-4">
                                        <div className="card-body">
                                            <h5 className="text-primary mb-3">
                                                <i className="bi bi-calendar-check me-2"></i>
                                                Pause Date: {formatDate(pauseDate)}
                                            </h5>
                                            <p className="text-muted mb-0">
                                                Select which meals you want to pause on this date
                                            </p>
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => {
                                            const canEdit = canEditMeal(meal);
                                            const isSelected = pauseMeals.includes(meal);
                                            
                                            return (
                                                <div key={meal} className="col-md-6">
                                                    <div 
                                                        className={`card h-100 meal-card ${isSelected ? 'border-danger bg-danger bg-opacity-10' : 'border-success'} ${!canEdit && isEditing ? 'opacity-50' : ''}`}
                                                        onClick={() => handleMealToggle(meal)}
                                                        style={{ cursor: canEdit || !isEditing ? 'pointer' : 'not-allowed' }}
                                                    >
                                                        <div className="card-body text-center p-3">
                                                            <div className="mb-2">
                                                                <i className={`bi bi-${meal === 'breakfast' ? 'cup-hot' : meal === 'lunch' ? 'bowl' : meal === 'snacks' ? 'cookie' : 'moon'} ${isSelected ? 'text-danger' : 'text-success'}`} style={{ fontSize: '2rem' }}></i>
                                                            </div>
                                                            <h6 className={`card-title text-capitalize ${isSelected ? 'text-danger' : 'text-success'}`}>
                                                                {meal}
                                                            </h6>
                                                            <p className="card-text small text-muted mb-2">
                                                                {mealTimings[meal].start}
                                                            </p>
                                                            {isSelected && (
                                                                <span className="badge bg-danger">
                                                                    <i className="bi bi-pause-fill me-1"></i>
                                                                    PAUSED
                                                                </span>
                                                            )}
                                                            {!canEdit && isEditing && (
                                                                <small className="text-warning d-block mt-1">
                                                                    <i className="bi bi-lock me-1"></i>
                                                                    Edit deadline passed
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 text-center">
                                        <button
                                            className="btn btn-primary btn-lg me-3"
                                            onClick={handleSubmit}
                                            disabled={submitting || pauseMeals.length === 0}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    {isEditing ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    {isEditing ? 'Update Pause' : 'Confirm Pause'}
                                                </>
                                            )}
                                        </button>
                                        <button className="btn btn-outline-secondary btn-lg" onClick={resetForm}>
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancel
                                        </button>
                                    </div>
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
                    border: 2px solid transparent !important;
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
                
                .alert {
                    border-radius: 10px;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default FoodPauseManagerNew;
