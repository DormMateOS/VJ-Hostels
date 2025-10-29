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
    const [lastDayMeals, setLastDayMeals] = useState([]); // For custom date last day
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

    // Deadline for changing tomorrow's meals: today 18:00 local time
    const isTomorrowDeadlinePassed = () => {
        const now = new Date();
        const deadline = new Date();
        deadline.setHours(18, 0, 0, 0); // 6:00 PM today
        return now >= deadline;
    };

    // For custom date range, minimum allowed start date
    const getMinStartDate = () => {
        // If deadline has passed, don't allow today
        if (isTomorrowDeadlinePassed()) {
            // Return tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const y = tomorrow.getFullYear();
            const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const d = String(tomorrow.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        // If deadline hasn't passed, allow tomorrow onwards
        return tomorrowDate;
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

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

    const computeUpcomingFridayToMonday = () => {
        const now = new Date();
        // get upcoming Friday (5)
        const day = now.getDay(); // 0 Sun ... 5 Fri
        const daysUntilFriday = (5 - day + 7) % 7; // 0 if today is Friday
        const friday = new Date(now);
        friday.setDate(now.getDate() + daysUntilFriday);

        const monday = new Date(friday);
        monday.setDate(friday.getDate() + 3); // Friday + 3 days = Monday

        const toISODate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        };

        return { start: toISODate(friday), end: toISODate(monday) };
    };

    const handlePauseTypeSelect = (type) => {
        // If selecting tomorrow but deadline passed, ignore selection and show message
        if (type === 'tomorrow' && isTomorrowDeadlinePassed()) {
            setMessage({ type: 'error', text: `Deadline has passed for tomorrow's meals. You can still schedule for future dates.` });
            return;
        }

        setPauseType(type);

        switch (type) {
            case 'tomorrow': {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const y = tomorrow.getFullYear();
                const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
                const d = String(tomorrow.getDate()).padStart(2, '0');
                const tmr = `${y}-${m}-${d}`;
                setStartDate(tmr);
                setEndDate(tmr);
                break;
            }
            case 'weekend': {
                const { start, end } = computeUpcomingFridayToMonday();
                setStartDate(start);
                setEndDate(end);
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
            
            // The UI asks the student to select meals they WILL HAVE.
            // The backend expects the list of paused meals, so compute the difference.
            const allMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
            const mealOrder = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };
            
            // For custom date range: 
            // - First day: pause meals NOT selected
            // - Middle days: pause ALL meals
            // - Last day: pause meals BEFORE the earliest selected meal
            if (pauseType === 'custom' && startDate !== endDate) {
                // Step 1: Create pauses for first day (only non-selected meals are paused)
                const pausedMealsFirstDay = allMeals.filter(m => !selectedMeals.includes(m));
                
                const pauseDataFirstDay = {
                    studentId: user.rollNumber,
                    meals: pausedMealsFirstDay,
                    pauseType,
                    startDate,
                    endDate: startDate, // Only first day
                    outpassId: outpassData?._id || null
                };

                console.log(`[Pause Submit] Custom range - First day (${startDate})`);
                console.log(`[Pause Submit] pausedMeals on first day: ${pausedMealsFirstDay.join(', ')}`);
                
                await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause`, pauseDataFirstDay);

                // Step 2: Calculate days between first and last day
                const firstDate = new Date(startDate);
                const lastDate = new Date(endDate);
                const daysDiff = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24));

                if (daysDiff > 1) {
                    // Step 2a: Create pauses for middle days (ALL meals paused) - only if more than 1 day difference
                    const nextDay = new Date(startDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

                    // End day is one day before the last day
                    const dayBeforeLastDay = new Date(lastDate);
                    dayBeforeLastDay.setDate(dayBeforeLastDay.getDate() - 1);
                    const dayBeforeLastDayStr = `${dayBeforeLastDay.getFullYear()}-${String(dayBeforeLastDay.getMonth() + 1).padStart(2, '0')}-${String(dayBeforeLastDay.getDate()).padStart(2, '0')}`;

                    const pauseDataMiddleDays = {
                        studentId: user.rollNumber,
                        meals: allMeals, // ALL meals paused for middle days
                        pauseType,
                        startDate: nextDayStr,
                        endDate: dayBeforeLastDayStr,
                        outpassId: outpassData?._id || null
                    };

                    console.log(`[Pause Submit] Custom range - Middle days (${nextDayStr} to ${dayBeforeLastDayStr})`);
                    console.log(`[Pause Submit] pausedMeals on middle days: ${allMeals.join(', ')}`);
                    
                    await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause`, pauseDataMiddleDays);
                }

                // Step 3: Create pauses for last day - pause only meals BEFORE the earliest selected meal on last day
                // Find the earliest (first) meal user selected for last day
                const earliestSelectedLastDayMeal = lastDayMeals.length > 0 
                    ? lastDayMeals.sort((a, b) => mealOrder[a] - mealOrder[b])[0]
                    : null;

                let pausedMealsLastDay = [];
                if (earliestSelectedLastDayMeal) {
                    // Pause all meals that come BEFORE the earliest selected meal on last day
                    pausedMealsLastDay = allMeals.filter(m => mealOrder[m] < mealOrder[earliestSelectedLastDayMeal]);
                }
                // If no meals selected on last day, pause all meals

                const pauseDataLastDay = {
                    studentId: user.rollNumber,
                    meals: pausedMealsLastDay,
                    pauseType,
                    startDate: endDate,
                    endDate: endDate, // Only last day
                    outpassId: outpassData?._id || null
                };

                console.log(`[Pause Submit] Custom range - Last day (${endDate})`);
                console.log(`[Pause Submit] User selected on last day: ${lastDayMeals.join(', ') || 'none'}`);
                console.log(`[Pause Submit] pausedMeals on last day: ${pausedMealsLastDay.join(', ') || 'none (all meals available)'}`);
                
                await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause`, pauseDataLastDay);
            } else {
                // For Tomorrow and Weekend: apply selected meal pauses to entire range
                const pausedMealsList = allMeals.filter(m => !selectedMeals.includes(m));
                
                const pauseData = {
                    studentId: user.rollNumber,
                    meals: pausedMealsList,
                    pauseType,
                    startDate,
                    endDate,
                    outpassId: outpassData?._id || null
                };

                console.log(`[Pause Submit] pauseType: ${pauseType}`);
                console.log(`[Pause Submit] Date range: ${startDate} to ${endDate}`);
                console.log(`[Pause Submit] pausedMeals: ${pausedMealsList.join(', ')}`);
                
                await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/enhanced/pause`, pauseData);
            }
            
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
        setLastDayMeals([]);
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
                                        {/* Deadline banner for Tomorrow */}
                                        <div className="col-12 mb-3">
                                            <div className="alert alert-warning" role="alert">
                                                <strong>Important Deadline</strong>
                                                <div className="mt-1">Changes for tomorrow's meals must be made before <strong>6:00 PM today</strong>. Current time: <strong>{new Date().toLocaleTimeString()}</strong></div>
                                                {isTomorrowDeadlinePassed() && (
                                                    <div className="mt-2 alert alert-danger p-2">⚠️ Deadline has passed for tomorrow's meals. You can still schedule for future dates.</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div 
                                                className={`card h-100 pause-option border-2 ${isTomorrowDeadlinePassed() ? 'border-secondary bg-light text-muted' : 'border-success'}`}
                                                onClick={() => !isTomorrowDeadlinePassed() && handlePauseTypeSelect('tomorrow')}
                                                style={{ cursor: isTomorrowDeadlinePassed() ? 'not-allowed' : 'pointer' }}
                                            >
                                                <div className="card-body text-center p-4">
                                                    <i className={`bi bi-calendar-plus ${isTomorrowDeadlinePassed() ? 'text-secondary' : 'text-success'} mb-3`} style={{ fontSize: '3rem' }}></i>
                                                    <h5 className={`card-title ${isTomorrowDeadlinePassed() ? 'text-secondary' : 'text-success'}`}>Tomorrow</h5>
                                                    <p className="card-text text-muted">Select what you'll have; others will be paused</p>
                                                    {isTomorrowDeadlinePassed() ? (
                                                        <small className="text-danger"><i className="bi bi-exclamation-triangle me-1"></i>Deadline passed (6 PM)</small>
                                                    ) : (
                                                        <small className="text-success"><i className="bi bi-check-circle me-1"></i>Available until 6 PM</small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div 
                                                className="card h-100 pause-option border-2 border-info"
                                                onClick={() => handlePauseTypeSelect('weekend')}
                                            >
                                                <div className="card-body text-center p-4">
                                                    <i className="bi bi-umbrella-beach text-info mb-3" style={{ fontSize: '3rem' }}></i>
                                                    <h5 className="card-title text-info">Weekend</h5>
                                                    <p className="card-text text-muted">Automatic: Friday to Monday</p>
                                                    <small className="text-info">
                                                        <i className="bi bi-calendar-event me-1"></i>
                                                        We'll set the dates for you
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
                                                    min={getMinStartDate()}
                                                    disabled={!!outpassData}
                                                />
                                                {isTomorrowDeadlinePassed() && (
                                                    <small className="text-danger d-block mt-2">
                                                        <i className="bi bi-exclamation-circle me-1"></i>
                                                        Today's 6 PM deadline has passed. Minimum start date is tomorrow.
                                                    </small>
                                                )}
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

                                            <h5 className="mb-3">Select Meals you WILL HAVE</h5>
                                            <div className="row g-3 mb-4">
                                                {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => {
                                                    const isSelected = selectedMeals.includes(meal);
                                                    
                                                    return (
                                                        <div key={meal} className="col-md-6">
                                                            <div 
                                                                className={`card h-100 meal-card ${isSelected ? 'border-success bg-success bg-opacity-10' : 'border-danger'}`}
                                                                onClick={() => handleMealToggle(meal)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="card-body text-center p-3">
                                                                    <i className={`bi bi-${meal === 'breakfast' ? 'cup-hot' : meal === 'lunch' ? 'bowl' : meal === 'snacks' ? 'cookie' : 'moon'} ${isSelected ? 'text-success' : 'text-danger'} mb-2`} style={{ fontSize: '2rem' }}></i>
                                                                    <h6 className={`card-title text-capitalize ${isSelected ? 'text-success' : 'text-danger'}`}>
                                                                        {meal}
                                                                    </h6>
                                                                    <p className="card-text small text-muted mb-2">
                                                                        {mealTimings[meal].start}
                                                                    </p>
                                                                    {isSelected && (
                                                                        <span className="badge bg-success">
                                                                            <i className="bi bi-check-circle me-1"></i>
                                                                            WILL HAVE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Last Day Meal Selection for Custom Date Range */}
                                            {pauseType === 'custom' && startDate !== endDate && (
                                                <div className="card border-3 border-success mb-4">
                                                    <div className="card-header bg-success bg-opacity-10 border-success border-bottom">
                                                        <h5 className="mb-0">
                                                            <i className="bi bi-calendar-check me-2"></i>
                                                            Select Meals You'll Have on Last Day ({formatDate(endDate)})
                                                        </h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <p className="text-muted mb-4">
                                                            Choose which meals you'll have on <strong>{formatDate(endDate)}</strong>. 
                                                            Meals before your first selected meal will automatically be paused.
                                                        </p>
                                                        <div className="row g-3">
                                                            {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => {
                                                                const isSelected = lastDayMeals.includes(meal);
                                                                
                                                                return (
                                                                    <div key={`lastday-${meal}`} className="col-md-6">
                                                                        <div 
                                                                            className={`card h-100 meal-card ${isSelected ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}
                                                                            onClick={() => setLastDayMeals(prev => 
                                                                                prev.includes(meal) 
                                                                                    ? prev.filter(m => m !== meal)
                                                                                    : [...prev, meal]
                                                                            )}
                                                                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                        >
                                                                            <div className="card-body text-center p-3">
                                                                                <i className={`bi bi-${meal === 'breakfast' ? 'cup-hot' : meal === 'lunch' ? 'bowl' : meal === 'snacks' ? 'cookie' : 'moon'} ${isSelected ? 'text-success' : 'text-secondary'} mb-2`} style={{ fontSize: '2rem' }}></i>
                                                                                <h6 className={`card-title text-capitalize ${isSelected ? 'text-success' : 'text-secondary'}`}>
                                                                                    {meal}
                                                                                </h6>
                                                                                <p className="card-text small text-muted mb-2">
                                                                                    {mealTimings[meal].start}
                                                                                </p>
                                                                                {isSelected && (
                                                                                    <span className="badge bg-success">
                                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                                        WILL HAVE
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Show what will be paused on last day based on selection */}
                                                        {lastDayMeals.length > 0 && (
                                                            <div className="alert alert-success mt-4 mb-0">
                                                                <h6 className="alert-heading mb-2">
                                                                    <i className="bi bi-check-circle me-2"></i>
                                                                    On {formatDate(endDate)}:
                                                                </h6>
                                                                <div className="row g-2">
                                                                    <div className="col-md-6">
                                                                        <p className="mb-2">
                                                                            <strong>Your meals:</strong><br/>
                                                                            {lastDayMeals.map(meal => (
                                                                                <span key={meal} className="badge bg-success me-2 mb-1">{meal.toUpperCase()}</span>
                                                                            ))}
                                                                        </p>
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        {(() => {
                                                                            const mealOrder = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };
                                                                            const allMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
                                                                            const earliestMeal = lastDayMeals.sort((a, b) => mealOrder[a] - mealOrder[b])[0];
                                                                            const pausedMeals = allMeals.filter(m => mealOrder[m] < mealOrder[earliestMeal]);
                                                                            
                                                                            return (
                                                                                <p className="mb-0">
                                                                                    <strong>Paused meals:</strong><br/>
                                                                                    {pausedMeals.length > 0 ? (
                                                                                        pausedMeals.map(meal => (
                                                                                            <span key={meal} className="badge bg-danger me-2 mb-1">✕ {meal.toUpperCase()}</span>
                                                                                        ))
                                                                                    ) : (
                                                                                        <span className="badge bg-success">✓ NONE</span>
                                                                                    )}
                                                                                </p>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="d-flex gap-4 justify-content-center mb-4">
                                            </div>

                                            <div className="mt-5 text-center">
                                                <button
                                                    className="btn me-4"
                                                    onClick={handleSubmit}
                                                    disabled={submitting || selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0)}
                                                    style={{
                                                        background: (selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0))
                                                            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                                                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '20px',
                                                        fontWeight: '800',
                                                        fontSize: '1.3rem',
                                                        padding: '15px 40px',
                                                        boxShadow: (selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0))
                                                            ? '0 10px 25px rgba(156, 163, 175, 0.4)' 
                                                            : '0 10px 25px rgba(139, 92, 246, 0.5)',
                                                        transition: 'all 0.4s ease',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        cursor: (selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0)) ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!e.target.disabled && selectedMeals.length > 0 && !(pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0)) {
                                                            e.target.style.transform = 'translateY(-5px) scale(1.08)';
                                                            e.target.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.7)';
                                                            e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!e.target.disabled) {
                                                            e.target.style.transform = 'translateY(0) scale(1)';
                                                            e.target.style.boxShadow = (selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0))
                                                                ? '0 10px 25px rgba(156, 163, 175, 0.4)' 
                                                                : '0 10px 25px rgba(139, 92, 246, 0.5)';
                                                            e.target.style.background = (selectedMeals.length === 0 || (pauseType === 'custom' && startDate !== endDate && lastDayMeals.length === 0))
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
