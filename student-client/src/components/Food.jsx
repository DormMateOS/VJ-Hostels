import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useCurrentUser from '../hooks/useCurrentUser';
import FoodPauseManager from './FoodPauseManager';
import FoodScheduleViewer, { getTodaysMenuFromSchedule } from './FoodScheduleViewer';
import '../styles/Food.css';

// Meal timings (24hr format)
const mealTimings = {
    breakfast: { start: "07:00", end: "09:00" },
    lunch: { start: "12:30", end: "14:00" },
    snacks: { start: "16:30", end: "18:30" },
    dinner: { start: "19:30", end: "21:00" }
};

// Helper to get status and color
const getMealStatus = (meal) => {
    const now = new Date();
    const [startH, startM] = mealTimings[meal].start.split(":").map(Number);
    const [endH, endM] = mealTimings[meal].end.split(":").map(Number);

    const start = new Date(now);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(now);
    end.setHours(endH, endM, 0, 0);

    const last30 = new Date(end.getTime() - 30 * 60000);

    if (now < start) return { color: "gray", status: "Not started" };
    if (now >= start && now < last30) return { color: "green", status: "Started" };
    if (now >= last30 && now < end) return { color: "orange", status: "Ending soon" };
    if (now >= end) return { color: "red", status: "Ended" };
};

// Blinking light component
const BlinkingLight = ({ color }) => (
    <span
        className="blinking-light"
        style={{
            background: color,
            animation: color !== 'gray' ? 'blink 1s infinite' : 'none',
            boxShadow: color !== 'gray' ? `0 0 8px 2px ${color}` : 'none'
        }}
    />
);

const Food = () => {
    const { user, loading: userLoading } = useCurrentUser();
    const [menu, setMenu] = useState(null);
    const [menuLoading, setMenuLoading] = useState(false);

    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('menu');
    // Feedback form state
    const [mealType, setMealType] = useState('breakfast');
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Add blinking animation to document head (once)
    useEffect(() => {
        if (!document.getElementById('blink-keyframes')) {
            const style = document.createElement('style');
            style.id = 'blink-keyframes';
            style.innerHTML = `
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
        fetchTodaysMenu();
    }, []);

    const fetchTodaysMenu = async () => {
        try {
            setMenuLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/student/menu/today-from-schedule`);
            setMenu(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching today\'s menu:', err);
            setError("No menu available for today.");
            setMenu(null);
        } finally {
            setMenuLoading(false);
        }
    };

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/student/menu/weekly-schedule`);
            setSchedule(response.data);
        } catch (err) {
            let errorMsg = "Failed to load menu schedule. Please try again later.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMsg += `\nDetails: ${err.response.data.message}`;
            } else if (err.message) {
                errorMsg += `\nDetails: ${err.message}`;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const canSubmitFeedback = (mealType) => {
        const mealStatus = getMealStatus(mealType);
        return mealStatus.status === 'Started' || mealStatus.status === 'Ending soon' || mealStatus.status === 'Ended';
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in to submit feedback.");
            return;
        }
        
        if (!canSubmitFeedback(mealType)) {
            setError(`You can only submit feedback for ${mealType} after it has started.`);
            return;
        }
        
        try {
            setSubmitting(true);
            const feedbackData = {
                mealType,
                rating: parseInt(rating),
                feedback
            };
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/student/feedback`, feedbackData);
            setSubmitSuccess(true);
            setFeedback('');
            setError(null);
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 3000);
        } catch (err) {
            setError("Failed to submit feedback. Please try again.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStarRating = () => {
        return (
            <div className="rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-button ${star <= rating ? 'active-star' : ''}`}
                        onClick={() => setRating(star)}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="food-container">
            <div className="food-header">
                <h2>Hostel Food Menu & Feedback</h2>
            </div>
            <div className="tab-container">
                <div className="row g-2 w-100">
                    <div className="col-6 col-md-3">
                        <div
                            className={`tab-card ${activeTab === 'menu' ? 'active-tab-card' : ''}`}
                            onClick={() => setActiveTab('menu')}
                        >
                            <i className="bi bi-list tab-icon"></i>
                            <span className="tab-text">Today's Menu</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div
                            className={`tab-card ${activeTab === 'feedback' ? 'active-tab-card' : ''}`}
                            onClick={() => setActiveTab('feedback')}
                        >
                            <i className="bi bi-chat-dots tab-icon"></i>
                            <span className="tab-text">Feedback</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div
                            className={`tab-card ${activeTab === 'schedule' ? 'active-tab-card' : ''}`}
                            onClick={() => setActiveTab('schedule')}
                        >
                            <i className="bi bi-calendar-week tab-icon"></i>
                            <span className="tab-text">Meal Schedule</span>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div
                            className={`tab-card ${activeTab === 'pause' ? 'active-tab-card' : ''}`}
                            onClick={() => setActiveTab('pause')}
                        >
                            <i className="bi bi-pause-circle tab-icon"></i>
                            <span className="tab-text">Pause Service</span>
                        </div>
                    </div>
                </div>
            </div>
            {/*menu tab*/}
            {activeTab === 'menu' && (
                <div>
                    {menuLoading ? (
                        <div className="text-center my-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading today's menu...</p>
                        </div>
                    ) : menu ? (
                        <div className="menu-card">
                            <h3 className="mb-3">
                               Today's Menu - {formatDate(menu.date)}
                            </h3>
                            <div className='card' style={{border: '1px solid whitesmoke',boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '1rem',borderRadius: '10px'}}>
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <div className='card' style={{border: '1px solid whitesmoke',boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '1rem',borderRadius: '10px'}} >
                                            <div className="meal-title">
                                                <BlinkingLight color={getMealStatus('breakfast').color} />
                                                Breakfast
                                                <small className="ms-2 text-muted">({getMealStatus('breakfast').status})</small>
                                            </div>
                                            <p className="mb-0">{menu.breakfast || 'Not available'}</p>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <div className='card' style={{border: '1px solid whitesmoke',boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '1rem',borderRadius: '10px'}} >
                                            <div className="meal-title">
                                                <BlinkingLight color={getMealStatus('lunch').color} />
                                                Lunch
                                                <small className="ms-2 text-muted">({getMealStatus('lunch').status})</small>
                                            </div>
                                            <p className="mb-0">{menu.lunch || 'Not available'}</p>
                                        </div>
                                    </div>
                                    {menu.snacks && (
                                        <div className="col-12 col-md-6">
                                            <div className='card' style={{border: '1px solid whitesmoke',boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '1rem',borderRadius: '10px'}} >
                                                <div className="meal-title">
                                                    <BlinkingLight color={getMealStatus('snacks').color} />
                                                    Snacks
                                                    <small className="ms-2 text-muted">({getMealStatus('snacks').status})</small>
                                                </div>
                                                <p className="mb-0">{menu.snacks}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-12 col-md-6">
                                        <div className='card' style={{border: '1px solid whitesmoke',boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '1rem',borderRadius: '10px'}} >
                                            <div className="meal-title">
                                                <BlinkingLight color={getMealStatus('dinner').color} />
                                                Dinner
                                                <small className="ms-2 text-muted">({getMealStatus('dinner').status})</small>
                                            </div>
                                            <p className="mb-0">{menu.dinner || 'Not available'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            No menu available for today. Please check back later.
                        </div>
                    )}
                </div>
            )}
            {/* Feedback Form */}
            {activeTab === 'feedback' && (
                <div>
                    {menuLoading ? (
                        <div className="text-center my-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading today's menu...</p>
                        </div>
                    ) : menu ? (
                        <div>
                            {/* Today's Menu Display for Feedback */}
                            <div className="card mb-4">
                                <div className="card-header bg-info text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-calendar-day me-2"></i>
                                        Today's Menu - {formatDate(menu.date)}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-2">
                                        {['breakfast', 'lunch', 'snacks', 'dinner'].map((meal) => {
                                            if (!menu[meal]) return null;
                                            const status = getMealStatus(meal);
                                            return (
                                                <div key={meal} className="col-12 col-sm-6 col-lg-3">
                                                    <div className={`card h-100 ${status.status === 'Not started' ? 'border-secondary' : status.status === 'Ended' ? 'border-danger' : 'border-success'}`}>
                                                        <div className="card-body p-2">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <BlinkingLight color={status.color} />
                                                                <h6 className="mb-0 text-capitalize ms-2">{meal}</h6>
                                                            </div>
                                                            <p className="small mb-1">{menu[meal]}</p>
                                                            <small className={`badge ${status.status === 'Not started' ? 'bg-secondary' : status.status === 'Ended' ? 'bg-danger' : 'bg-success'}`}>
                                                                {status.status}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Form */}
                            <form className="feedback-form" onSubmit={handleSubmitFeedback}>
                                {submitSuccess && (
                                    <div className="alert alert-success">
                                        <i className="bi bi-check-circle me-2"></i>
                                        Feedback submitted successfully!
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-danger">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {error}
                                    </div>
                                )}
                                <div className="form-group mb-3">
                                    <label className="form-label">Meal Type</label>
                                    <div className="dropdown-container">
                                        <select
                                            className="form-select"
                                            value={mealType}
                                            onChange={(e) => setMealType(e.target.value)}
                                            disabled={submitting}
                                            style={{ maxWidth: '100%', overflow: 'hidden' }}
                                        >
                                            {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => {
                                                if (!menu[meal]) return null;
                                                const canSubmit = canSubmitFeedback(meal);
                                                return (
                                                    <option key={meal} value={meal} disabled={!canSubmit}>
                                                        {meal.charAt(0).toUpperCase() + meal.slice(1)} 
                                                        {!canSubmit ? ' (Not started)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    {!canSubmitFeedback(mealType) && (
                                        <small className="text-warning">
                                            <i className="bi bi-clock me-1"></i>
                                            Feedback available after meal starts.
                                        </small>
                                    )}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Rating</label>
                                    {renderStarRating()}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Feedback</label>
                                    <textarea
                                        className="form-control"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        disabled={submitting || !canSubmitFeedback(mealType)}
                                        required
                                        rows="3"
                                        placeholder="Share your thoughts about the meal..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !canSubmitFeedback(mealType)}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            No menu available for today. Cannot submit feedback.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'schedule' && (
                <FoodScheduleViewer />
            )}

            {activeTab === 'pause' && (
                <FoodPauseManager />
            )}
        </div>
    );
};

export default Food;