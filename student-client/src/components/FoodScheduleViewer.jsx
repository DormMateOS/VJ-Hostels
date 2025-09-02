import { useState, useEffect } from 'react';
import axios from 'axios';
import useCurrentUser from '../hooks/useCurrentUser';

const FoodScheduleViewer = () => {
    const { user, loading: userLoading } = useCurrentUser();
    const [studentStatus, setStudentStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [weekDates, setWeekDates] = useState([]);
    const [foodSchedule, setFoodSchedule] = useState([]);
    const [showAllDays, setShowAllDays] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    useEffect(() => {
        if (user?.rollNumber) {
            fetchStudentStatus();
            fetchFoodSchedule();
            generateWeekDates();
        }
    }, [user?.rollNumber]);

    const fetchStudentStatus = async () => {
        try {
            setStatusLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/student-status?studentId=${user.rollNumber}`);
            setStudentStatus(response.data);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setStatusLoading(false);
        }
    };

    const fetchFoodSchedule = async () => {
        try {
            setScheduleLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/student/menu/weekly-schedule`);
            setFoodSchedule(response.data);
        } catch (error) {
            console.error('Error fetching food schedule:', error);
            setFoodSchedule([]);
        } finally {
            setScheduleLoading(false);
        }
    };

    const generateWeekDates = () => {
        const dates = [];
        const today = new Date();
        
        // Generate next 7 days starting from today
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        setWeekDates(dates);
    };

    const getMenuForDate = (dateString) => {
        return foodSchedule.find(item => item.date === dateString) || null;
    };

    const getMealsForDate = (dateString) => {
        const allMeals = ['breakfast', 'lunch', 'snacks', 'dinner'];
        
        if (!studentStatus || !studentStatus.pause_from) {
            return allMeals;
        }

        const pauseDate = studentStatus.pause_from;
        const resumeDate = studentStatus.resume_from;

        if (dateString < pauseDate) {
            return allMeals;
        } else if (dateString === pauseDate) {
            return studentStatus.pause_meals ? studentStatus.pause_meals.split(',') : [];
        } else if (resumeDate && dateString > pauseDate && dateString < resumeDate) {
            return [];
        } else if (resumeDate && dateString === resumeDate) {
            return studentStatus.resume_meals ? studentStatus.resume_meals.split(',') : [];
        } else if (resumeDate && dateString > resumeDate) {
            return allMeals;
        } else if (!resumeDate && dateString > pauseDate) {
            return [];
        }
        
        return allMeals;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        if (dateString === today) {
            return 'Today';
        } else if (dateString === tomorrow) {
            return 'Tomorrow';
        }
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getMealIcon = (meal) => {
        const icons = {
            'breakfast': '🍳',
            'lunch': '🍛',
            'snacks': '☕',
            'dinner': '🍽️'
        };
        return icons[meal] || '🍽️';
    };

    const getMealTime = (meal) => {
        const times = {
            'breakfast': '7:30-10:00 AM',
            'lunch': '12:00-2:00 PM',
            'snacks': '4:00-6:00 PM',
            'dinner': '7:30-9:30 PM'
        };
        return times[meal] || '';
    };

    const getDateStatus = (dateString) => {
        if (!studentStatus?.pause_from) return 'active';
        
        const pauseDate = studentStatus.pause_from;
        const resumeDate = studentStatus.resume_from;
        
        if (dateString < pauseDate) return 'active';
        if (dateString === pauseDate) return 'last-day';
        if (resumeDate && dateString > pauseDate && dateString < resumeDate) return 'paused';
        if (resumeDate && dateString === resumeDate) return 'return-day';
        if (resumeDate && dateString > resumeDate) return 'active';
        if (!resumeDate && dateString > pauseDate) return 'paused';
        
        return 'active';
    };

    if (userLoading || statusLoading || scheduleLoading || !user) {
        return (
            <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your meal schedule...</p>
            </div>
        );
    }

    // Get dates to display (first 3 days or all 7 days)
    const datesToShow = showAllDays ? weekDates : weekDates.slice(0, 3);

    return (
        <div className="food-schedule-viewer">
            <div className="card">
                <div className="card-header bg-success text-white">
                    <h4 className="mb-0">
                        <i className="bi bi-calendar-week me-2"></i>
                        Your Meal Schedule
                    </h4>
                </div>
                <div className="card-body">
                    <div className="row g-2 g-md-3">
                        {datesToShow.map((date) => {
                            const meals = getMealsForDate(date);
                            const status = getDateStatus(date);
                            const dayMenu = getMenuForDate(date);
                            
                            return (
                                <div key={date} className="col-12 col-sm-6 col-lg-4">
                                    <div className={`card h-100 ${status === 'paused' ? 'border-warning' : status === 'last-day' || status === 'return-day' ? 'border-info' : 'border-success'}`}>
                                        <div className={`card-header text-center py-2 ${status === 'paused' ? 'bg-warning text-dark' : status === 'last-day' || status === 'return-day' ? 'bg-info text-white' : 'bg-success text-white'}`}>
                                            <h6 className="mb-0 fs-6">{formatDate(date)}</h6>
                                            <small className="d-block" style={{ fontSize: '0.7rem' }}>
                                                {status === 'last-day' && 'Last Day'}
                                                {status === 'return-day' && 'Return Day'}
                                                {status === 'paused' && 'Away'}
                                                {status === 'active' && 'Normal Day'}
                                            </small>
                                        </div>
                                        <div className="card-body p-2">
                                            {meals.length > 0 && dayMenu ? (
                                                <div className="meal-schedule">
                                                    {meals.map((meal) => {
                                                        const mealContent = dayMenu[meal];
                                                        if (!mealContent) return null;
                                                        
                                                        return (
                                                            <div key={meal} className="mb-2 p-2 bg-light rounded" style={{ fontSize: '0.8rem' }}>
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <span className="me-2" style={{ fontSize: '0.9rem' }}>{getMealIcon(meal)}</span>
                                                                    <div className="fw-bold text-capitalize flex-grow-1">
                                                                        {meal}
                                                                    </div>
                                                                    <i className="bi bi-check-circle text-success" style={{ fontSize: '0.8rem' }}></i>
                                                                </div>
                                                                <div className="text-muted mb-1" style={{ fontSize: '0.65rem' }}>
                                                                    {getMealTime(meal)}
                                                                </div>
                                                                <div className="text-dark" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                                                                    {mealContent}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-3">
                                                    <i className="bi bi-x-circle mb-2" style={{ fontSize: '2rem' }}></i>
                                                    <div style={{ fontSize: '0.8rem' }}>No meals available</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Show More/Less Button */}
                    {weekDates.length > 3 && (
                        <div className="text-center mt-3">
                            <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setShowAllDays(!showAllDays)}
                            >
                                {showAllDays ? (
                                    <>
                                        <i className="bi bi-chevron-up me-1"></i>
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-chevron-down me-1"></i>
                                        Show More ({weekDates.length - 3} more days)
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {studentStatus?.pause_from && (
                        <div className="mt-4">
                            <div className="alert alert-info">
                                <h6 className="alert-heading">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Current Pause Schedule
                                </h6>
                                <p className="mb-1">
                                    <strong>Pause starts:</strong> {new Date(studentStatus.pause_from).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                {studentStatus.resume_from && (
                                    <p className="mb-1">
                                        <strong>Resume on:</strong> {new Date(studentStatus.resume_from).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                                {studentStatus.pause_meals && (
                                    <p className="mb-1">
                                        <strong>Last day meals:</strong> {studentStatus.pause_meals}
                                    </p>
                                )}
                                {studentStatus.resume_meals && (
                                    <p className="mb-0">
                                        <strong>Return day meals:</strong> {studentStatus.resume_meals}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-3">
                        <div className="row g-2">
                            <div className="col-6 col-md-3 mb-2">
                                <div className="d-flex align-items-center">
                                    <div className="bg-success rounded me-2" style={{ width: '10px', height: '10px' }}></div>
                                    <small style={{ fontSize: '0.75rem' }}>Normal Day</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                                <div className="d-flex align-items-center">
                                    <div className="bg-info rounded me-2" style={{ width: '10px', height: '10px' }}></div>
                                    <small style={{ fontSize: '0.75rem' }}>Special Day</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                                <div className="d-flex align-items-center">
                                    <div className="bg-warning rounded me-2" style={{ width: '10px', height: '10px' }}></div>
                                    <small style={{ fontSize: '0.75rem' }}>Away</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodScheduleViewer;
export const getTodaysMenuFromSchedule = (schedule) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return schedule.find(item => item.date === todayStr) || null;
};
