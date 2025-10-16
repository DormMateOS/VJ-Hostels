import { useState, useEffect } from 'react';
import axios from 'axios';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const FoodPauseManager = () => {
    const { user } = useCurrentUser();
    const [currentStatus, setCurrentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [pauseType, setPauseType] = useState('');
    const [pauseFrom, setPauseFrom] = useState('');
    const [resumeFrom, setResumeFrom] = useState('');
    const [pauseMeals, setPauseMeals] = useState([]);
    const [resumeMeals, setResumeMeals] = useState([]);
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePauseTypeSelect = (type) => {
        setPauseType(type);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        switch (type) {
            case 'tomorrow':
                setPauseFrom(tomorrow.toISOString().split('T')[0]);
                const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
                setResumeFrom(dayAfterTomorrow.toISOString().split('T')[0]);
                break;
            case 'weekend':
                const friday = new Date(today);
                friday.setDate(today.getDate() + (5 - today.getDay()));
                const monday = new Date(friday.getTime() + 3 * 24 * 60 * 60 * 1000);
                setPauseFrom(friday.toISOString().split('T')[0]);
                setResumeFrom(monday.toISOString().split('T')[0]);
                break;
            case 'custom':
                setPauseFrom('');
                setResumeFrom('');
                break;
        }
        setStep(2);
    };

    const handleMealToggle = (meal, type) => {
        if (type === 'pause') {
            setPauseMeals(prev => 
                prev.includes(meal) 
                    ? prev.filter(m => m !== meal)
                    : [...prev, meal]
            );
        } else {
            setResumeMeals(prev => 
                prev.includes(meal) 
                    ? prev.filter(m => m !== meal)
                    : [...prev, meal]
            );
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            
            const data = {
                studentId: user.rollNumber,
                pause_from: pauseFrom,
                pause_meals: pauseMeals.join(','),
                resume_from: resumeFrom,
                resume_meals: resumeMeals.join(',')
            };

            await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/pause`, data);
            
            setMessage({ type: 'success', text: 'Food service pause updated successfully!' });
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

    const resetForm = () => {
        setStep(1);
        setPauseType('');
        setPauseFrom('');
        setResumeFrom('');
        setPauseMeals([]);
        setResumeMeals([]);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusInfo = () => {
        if (!currentStatus?.pause_from) {
            return { type: 'active', message: 'Food service is active' };
        }

        const pauseDate = currentStatus.pause_from;
        const resumeDate = currentStatus.resume_from;

        if (today < pauseDate) {
            return { 
                type: 'upcoming', 
                message: `Food will be paused from ${formatDate(pauseDate)}` 
            };
        } else if (today === pauseDate) {
            return { 
                type: 'last-day', 
                message: 'Last day before going away' 
            };
        } else if (resumeDate && today > pauseDate && today < resumeDate) {
            return { 
                type: 'paused', 
                message: `Away until ${formatDate(resumeDate)}` 
            };
        } else if (resumeDate && today === resumeDate) {
            return { 
                type: 'return-day', 
                message: 'Welcome back! First day return' 
            };
        } else if (resumeDate && today > resumeDate) {
            return { 
                type: 'active', 
                message: 'Food service is active' 
            };
        } else {
            return { 
                type: 'paused', 
                message: 'Food service paused indefinitely' 
            };
        }
    };

    if (loading) {
        return (
            <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your food status...</p>
            </div>
        );
    }

    const statusInfo = getStatusInfo();

    return (
        <div className="food-pause-manager">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">
                        <i className="bi bi-pause-circle me-2"></i>
                        Food Service Management
                    </h4>
                </div>
                <div className="card-body">
                    {message && (
                        <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : 'info'} alert-dismissible fade show`} role="alert">
                            {message.text}
                            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                        </div>
                    )}

                    {/* Current Status */}
                    {/* <div className="mb-4">
                        <h5>Current Status</h5>
                        <div className={`alert alert-${statusInfo.type === 'active' ? 'success' : statusInfo.type === 'paused' ? 'warning' : 'info'}`}>
                            <i className={`bi bi-${statusInfo.type === 'active' ? 'check-circle' : statusInfo.type === 'paused' ? 'pause-circle' : 'info-circle'} me-2`}></i>
                            {statusInfo.message}
                        </div>
                    </div> */}

                    {step === 1 && (
                        <div>
                            <h5>When do you want to pause your food service?</h5>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="card h-100 pause-option" onClick={() => handlePauseTypeSelect('tomorrow')}>
                                        <div className="card-body text-center">
                                            <i className="bi bi-calendar-day display-4 text-primary mb-3"></i>
                                            <h6>Tomorrow Only</h6>
                                            <p className="text-muted small">Pause for just one day</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card h-100 pause-option" onClick={() => handlePauseTypeSelect('weekend')}>
                                        <div className="card-body text-center">
                                            <i className="bi bi-calendar-week display-4 text-success mb-3"></i>
                                            <h6>This Weekend</h6>
                                            <p className="text-muted small">Friday evening to Monday morning</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card h-100 pause-option" onClick={() => handlePauseTypeSelect('custom')}>
                                        <div className="card-body text-center">
                                            <i className="bi bi-calendar-range display-4 text-warning mb-3"></i>
                                            <h6>Custom Period</h6>
                                            <p className="text-muted small">Choose your own dates</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Configure Your Pause</h5>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setStep(1)}>
                                    <i className="bi bi-arrow-left me-1"></i>Back
                                </button>
                            </div>

                            {pauseType === 'custom' && (
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">Pause From</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={pauseFrom}
                                            onChange={(e) => setPauseFrom(e.target.value)}
                                            min={tomorrow}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Resume From</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={resumeFrom}
                                            onChange={(e) => setResumeFrom(e.target.value)}
                                            min={pauseFrom}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6">
                                    <h6>Last Day Meals ({formatDate(pauseFrom)})</h6>
                                    <p className="text-muted small">Select meals you'll have on your last day</p>
                                    <div className="meal-selection">
                                        {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                                            <div key={meal} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`pause-${meal}`}
                                                    checked={pauseMeals.includes(meal)}
                                                    onChange={() => handleMealToggle(meal, 'pause')}
                                                />
                                                <label className="form-check-label text-capitalize" htmlFor={`pause-${meal}`}>
                                                    {meal}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h6>Return Day Meals ({formatDate(resumeFrom)})</h6>
                                    <p className="text-muted small">Select meals you'll have on your return day</p>
                                    <div className="meal-selection">
                                        {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                                            <div key={meal} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`resume-${meal}`}
                                                    checked={resumeMeals.includes(meal)}
                                                    onChange={() => handleMealToggle(meal, 'resume')}
                                                />
                                                <label className="form-check-label text-capitalize" htmlFor={`resume-${meal}`}>
                                                    {meal}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setStep(3)}
                                    disabled={!pauseFrom || !resumeFrom}
                                >
                                    Continue to Review
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Review & Confirm</h5>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setStep(2)}>
                                    <i className="bi bi-arrow-left me-1"></i>Back
                                </button>
                            </div>

                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6>Pause Summary</h6>
                                    <p><strong>Last Day:</strong> {formatDate(pauseFrom)}</p>
                                    <p><strong>Last Day Meals:</strong> {pauseMeals.length > 0 ? pauseMeals.join(', ') : 'None'}</p>
                                    <p><strong>Return Day:</strong> {formatDate(resumeFrom)}</p>
                                    <p><strong>Return Day Meals:</strong> {resumeMeals.length > 0 ? resumeMeals.join(', ') : 'None'}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    className="btn btn-success me-2"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Confirm Pause
                                        </>
                                    )}
                                </button>
                                <button className="btn btn-outline-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .pause-option {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .pause-option:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .meal-selection {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 0.5rem;
                }
            `}</style>
        </div>
    );
};

export default FoodPauseManager;
