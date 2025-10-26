import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import FoodCountManager from './FoodCountManager';
import StudentFoodManager from './StudentFoodManager';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const Food = () => {
    const [activeTab, setActiveTab] = useState('menu');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAdmin();

    // Menu state
    const [menus, setMenus] = useState([]);
    const [menuFormData, setMenuFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        breakfast: '',
        lunch: '',
        dinner: '',
        snacks: ''
    });

    // Monthly menu data from backend
    const [monthlyMenuData, setMonthlyMenuData] = useState({});

    // Selected cell state for editing
    const [selectedCell, setSelectedCell] = useState(null);
    const [editFormData, setEditFormData] = useState({
        week: '',
        day: '',
        breakfast: '',
        lunch: '',
        snacks: '',
        dinner: ''
    });

    // Function to get current week number (1-4)
    const getCurrentWeek = () => {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        return Math.min(weekNumber, 4); // Ensure it's between 1-4
    };

    const [currentWeek] = useState(() => getCurrentWeek());

    // Week filter state
    const [selectedWeek, setSelectedWeek] = useState(() => `week${getCurrentWeek()}`);
    const [menuFormLoading, setMenuFormLoading] = useState(false);
    const [menuFormSuccess, setMenuFormSuccess] = useState('');
    const [menuFormError, setMenuFormError] = useState('');

    // Feedback state
    const [feedback, setFeedback] = useState([]);
    const [feedbackStats, setFeedbackStats] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackFilters, setFeedbackFilters] = useState({
        dateFilter: 'today',
        customStartDate: '',
        customEndDate: '',
        mealType: 'all'
    });

    // Derived feedback views computed from raw `feedback` (client-side)
    const getDateStr = (d) => new Date(d).toISOString().split('T')[0];

    const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];

    // Today's date string
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute filtered period's averages and rating distribution, plus recent 7-day trends
    const {
        todayAvgByMeal,
        todayRatingDistribution,
        totalTodayReviews,
        recentTrendsFromFeedback,
        recentDates,
        recentByDate,
        filteredDates
    } = (() => {
        // Group reviews by date and meal
        const byDateMeal = {}; // { 'YYYY-MM-DD': { mealType: [ratings] } }

        feedback.forEach(f => {
            // Ensure f.date exists and is parseable
            const dateStr = f.date ? getDateStr(f.date) : null;
            if (!dateStr) return;

            // ignore future-dated reviews
            if (dateStr > todayStr) return;

            if (!byDateMeal[dateStr]) byDateMeal[dateStr] = {};
            if (!byDateMeal[dateStr][f.mealType]) byDateMeal[dateStr][f.mealType] = [];
            byDateMeal[dateStr][f.mealType].push(Number(f.rating));
        });

        // Determine which dates to use for statistics based on filter
        let datesForStats = [todayStr]; // default to today
        if (feedbackFilters.dateFilter === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            datesForStats = [yesterday.toISOString().split('T')[0]];
        } else if (feedbackFilters.dateFilter === 'thisWeek') {
            const d = new Date();
            const dayOfWeek = d.getDay();
            datesForStats = [];
            for (let i = dayOfWeek; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                datesForStats.push(date.toISOString().split('T')[0]);
            }
        } else if (feedbackFilters.dateFilter === 'lastWeek') {
            const d = new Date();
            const dayOfWeek = d.getDay();
            datesForStats = [];
            for (let i = dayOfWeek + 7; i >= dayOfWeek + 1; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                datesForStats.push(date.toISOString().split('T')[0]);
            }
        } else if (feedbackFilters.dateFilter === 'thisMonth') {
            const d = new Date();
            datesForStats = [];
            for (let i = d.getDate(); i >= 1; i--) {
                const date = new Date(d.getFullYear(), d.getMonth(), i);
                datesForStats.push(date.toISOString().split('T')[0]);
            }
        } else if (feedbackFilters.dateFilter === 'lastMonth') {
            const d = new Date();
            const lastMonth = d.getMonth() - 1;
            const year = lastMonth < 0 ? d.getFullYear() - 1 : d.getFullYear();
            const month = lastMonth < 0 ? 11 : lastMonth;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            datesForStats = [];
            for (let i = daysInMonth; i >= 1; i--) {
                const date = new Date(year, month, i);
                datesForStats.push(date.toISOString().split('T')[0]);
            }
        } else if (feedbackFilters.dateFilter === 'custom' && feedbackFilters.customStartDate && feedbackFilters.customEndDate) {
            const start = new Date(feedbackFilters.customStartDate);
            const end = new Date(feedbackFilters.customEndDate);
            datesForStats = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                datesForStats.push(d.toISOString().split('T')[0]);
                if (datesForStats.length > 0 && datesForStats[datesForStats.length - 1] === end.toISOString().split('T')[0]) break;
            }
        }

        // Calculate averages for filtered period
        const filteredAvg = {};
        let filteredTotal = 0;
        mealTypes.forEach(mt => {
            let allRatings = [];
            datesForStats.forEach(dateStr => {
                const ratings = (byDateMeal[dateStr] && byDateMeal[dateStr][mt]) || [];
                allRatings = allRatings.concat(ratings);
            });
            const count = allRatings.length;
            filteredTotal += count;
            const avg = count ? allRatings.reduce((a,b)=>a+b,0)/count : 0;
            filteredAvg[mt] = { averageRating: avg, count };
        });

        // Filtered period's rating distribution (1-5)
        const filteredRatingDist = [0,0,0,0,0]; // indices 0->1star ... 4->5star
        datesForStats.forEach(dateStr => {
            if (byDateMeal[dateStr]) {
                Object.values(byDateMeal[dateStr]).forEach(arr => {
                    arr.forEach(r => {
                        const idx = Math.min(Math.max(Math.round(r) - 1, 0), 4);
                        filteredRatingDist[idx]++;
                    });
                });
            }
        });

        // Recent 7 days including today: generate date strings from oldest to newest
        const recentDates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            recentDates.push(d.toISOString().split('T')[0]);
        }

        const recentTrends = [];
        const recentByDate = {}; // { date: { mealType: avg|null } }
        recentDates.forEach(date => {
            recentByDate[date] = {};
            mealTypes.forEach(mt => {
                const ratings = (byDateMeal[date] && byDateMeal[date][mt]) || [];
                const avg = ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : null;
                recentByDate[date][mt] = avg;
                recentTrends.push({ _id: { date, mealType: mt }, averageRating: avg });
            });
        });

        return {
            todayAvgByMeal: filteredAvg,
            todayRatingDistribution: filteredRatingDist,
            totalTodayReviews: filteredTotal,
            recentTrendsFromFeedback: recentTrends,
            recentDates,
            recentByDate,
            filteredDates: datesForStats
        };
    })();

    useEffect(() => {
        if (activeTab === 'menu') {
            fetchMenus();
            fetchMonthlyMenu();
        } else if (activeTab === 'feedback') {
            fetchFeedback();
            fetchFeedbackStats();
        }
    }, [activeTab, token]);

    useEffect(() => {
        if (activeTab === 'feedback') {
            fetchFeedback();
        }
    }, [feedbackFilters]);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/menus`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMenus(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load menus');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch monthly menu data from backend
    const fetchMonthlyMenu = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/menu/monthly`);
            if (response.data.success) {
                setMonthlyMenuData(response.data.data);
            }
            setError('');
        } catch (err) {
            setError('Failed to load monthly menu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedback = async () => {
        try {
            setFeedbackLoading(true);
            const queryParams = new URLSearchParams(feedbackFilters).toString();
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/feedback?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setFeedback(response.data);
        } catch (err) {
            console.error('Failed to load feedback:', err);
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleFeedbackFilterChange = (key, value) => {
        setFeedbackFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const fetchFeedbackStats = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/feedback/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setFeedbackStats(response.data);
        } catch (err) {
            console.error('Failed to load feedback stats:', err);
        }
    };

    const handleMenuInputChange = (e) => {
        const { name, value } = e.target;
        setMenuFormData({
            ...menuFormData,
            [name]: value
        });
    };

    const handleMenuSubmit = async (e) => {
        e.preventDefault();
        setMenuFormError('');
        setMenuFormSuccess('');
        setMenuFormLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/menu`,
                menuFormData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setMenuFormSuccess(response.data.message);
            fetchMenus();

            // Reset form except date
            setMenuFormData({
                date: menuFormData.date,
                breakfast: '',
                lunch: '',
                dinner: '',
                snacks: ''
            });

            setTimeout(() => {
                setMenuFormSuccess('');
            }, 3000);
        } catch (err) {
            setMenuFormError(err.response?.data?.message || 'Failed to save menu');
            console.error(err);
        } finally {
            setMenuFormLoading(false);
        }
    };

    // Handle cell click to populate edit form
    const handleCellClick = (week, day, mealType) => {
        const dayData = monthlyMenuData[week][day];
        setSelectedCell({ week, day, mealType });
        setEditFormData({
            week: week,
            day: day,
            breakfast: dayData.breakfast,
            lunch: dayData.lunch,
            snacks: dayData.snacks,
            dinner: dayData.dinner
        });
    };

    // Handle edit form input changes
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit form submission
    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        if (!editFormData.week || !editFormData.day) return;

        try {
            const response = await axios.put(`${import.meta.env.VITE_SERVER_URL}/food-api/menu/day`, {
                week: editFormData.week,
                day: editFormData.day,
                breakfast: editFormData.breakfast,
                lunch: editFormData.lunch,
                snacks: editFormData.snacks,
                dinner: editFormData.dinner
            });

            if (response.data.success) {
                // Update the local state
                setMonthlyMenuData(prev => ({
                    ...prev,
                    [editFormData.week]: {
                        ...prev[editFormData.week],
                        [editFormData.day]: {
                            breakfast: editFormData.breakfast,
                            lunch: editFormData.lunch,
                            snacks: editFormData.snacks,
                            dinner: editFormData.dinner
                        }
                    }
                }));

                // Clear selection
                setSelectedCell(null);
                setEditFormData({
                    week: '',
                    day: '',
                    breakfast: '',
                    lunch: '',
                    snacks: '',
                    dinner: ''
                });

                // Show success message
                setMenuFormSuccess('Menu updated successfully!');
                setTimeout(() => setMenuFormSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error updating menu:', error);
            setMenuFormError('Failed to update menu. Please try again.');
            setTimeout(() => setMenuFormError(''), 3000);
        }
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Function to get color based on rating
    const getRatingColor = (rating) => {
        if (rating >= 4.5) return 'success';
        if (rating >= 3.5) return 'info';
        if (rating >= 2.5) return 'warning';
        return 'danger';
    };

    // Function to render stars based on rating
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <div className="d-inline-block">
                {[...Array(fullStars)].map((_, i) => (
                    <i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>
                ))}
                {halfStar && <i className="bi bi-star-half text-warning"></i>}
                {[...Array(emptyStars)].map((_, i) => (
                    <i key={`empty-${i}`} className="bi bi-star text-warning"></i>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Food Management</h2>
                <div className="btn-group">
                    <button
                        className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        <i className="bi bi-calendar-week me-2"></i>
                        Menu Management
                    </button>
                    <button
                        className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('feedback')}
                    >
                        <i className="bi bi-star me-2"></i>
                        Feedback & Reviews
                    </button>
                    {/* <button
                        className={`btn ${activeTab === 'count' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('count')}
                    >
                        <i className="bi bi-calculator me-2"></i>
                        Food Count
                    </button> */}
                    <button
                        className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('students')}
                    >
                        <i className="bi bi-people me-2"></i>
                        Student Management
                    </button>
                </div>
            </div>

            {activeTab === 'menu' && (
                <div className="row">
                    <div className="col-md-5">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">
                                    {selectedCell ? 'Edit Menu Item' : 'Create/Update Menu'}
                                </h5>
                            </div>
                            <div className="card-body">
                                {selectedCell ? (
                                    // Edit form for selected cell
                                    <div>
                                        <div className="alert alert-info" role="alert">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Editing: <strong>{selectedCell.week.charAt(0).toUpperCase() + selectedCell.week.slice(1)} - {selectedCell.day.charAt(0).toUpperCase() + selectedCell.day.slice(1)}</strong>
                                        </div>
                                        <form onSubmit={handleEditFormSubmit}>
                                            <div className="mb-3">
                                                <label className="form-label">Week & Day</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={`${editFormData.week.charAt(0).toUpperCase() + editFormData.week.slice(1)} - ${editFormData.day.charAt(0).toUpperCase() + editFormData.day.slice(1)}`}
                                                    disabled
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edit-breakfast" className="form-label">
                                                    <i className="bi bi-sunrise me-2 text-warning"></i>
                                                    Breakfast
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="edit-breakfast"
                                                    name="breakfast"
                                                    rows="2"
                                                    value={editFormData.breakfast}
                                                    onChange={handleEditFormChange}
                                                    placeholder="Enter breakfast menu items..."
                                                ></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edit-lunch" className="form-label">
                                                    <i className="bi bi-sun me-2 text-warning"></i>
                                                    Lunch
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="edit-lunch"
                                                    name="lunch"
                                                    rows="2"
                                                    value={editFormData.lunch}
                                                    onChange={handleEditFormChange}
                                                    placeholder="Enter lunch menu items..."
                                                ></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edit-snacks" className="form-label">
                                                    <i className="bi bi-cup-hot me-2 text-warning"></i>
                                                    Snacks
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="edit-snacks"
                                                    name="snacks"
                                                    rows="2"
                                                    value={editFormData.snacks}
                                                    onChange={handleEditFormChange}
                                                    placeholder="Enter snacks menu items..."
                                                ></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edit-dinner" className="form-label">
                                                    <i className="bi bi-moon me-2 text-warning"></i>
                                                    Dinner
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="edit-dinner"
                                                    name="dinner"
                                                    rows="2"
                                                    value={editFormData.dinner}
                                                    onChange={handleEditFormChange}
                                                    placeholder="Enter dinner menu items..."
                                                ></textarea>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button type="submit" className="btn btn-success">
                                                    <i className="bi bi-check-lg me-1"></i>
                                                    Update Menu
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setSelectedCell(null);
                                                        setEditFormData({
                                                            week: '',
                                                            day: '',
                                                            breakfast: '',
                                                            lunch: '',
                                                            snacks: '',
                                                            dinner: ''
                                                        });
                                                    }}
                                                >
                                                    <i className="bi bi-x-lg me-1"></i>
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    // Placeholder message to click on menu
                                    <div className="text-center my-5">
                                        <div className="mb-3">
                                            <i className="bi bi-cursor-fill text-primary" style={{ fontSize: '3rem' }}></i>
                                        </div>
                                        <h5 className="text-muted mb-2">Click on a Menu Item to Edit</h5>
                                        <p className="text-muted mb-0">
                                            Select any menu item from the table on the right to edit its details
                                        </p>
                                        <div className="mt-3">
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Click on any cell in the menu table to start editing
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-7">
                        <div className="card">
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Menu History</h5>
                                <div className="d-flex align-items-center gap-2">
                                    <label htmlFor="weekSelect" className="form-label mb-0 me-2">
                                        <i className="bi bi-calendar-week me-1"></i>
                                        Select Week:
                                    </label>
                                    <select
                                        id="weekSelect"
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto', minWidth: '150px' }}
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                    >
                                        <option value="">Select Week...</option>
                                        {Object.keys(monthlyMenuData).map((weekKey) => {
                                            const weekNumber = parseInt(weekKey.replace('week', ''));
                                            const isCurrentWeek = weekNumber === currentWeek;
                                            return (
                                                <option key={weekKey} value={weekKey}>
                                                    Week {weekNumber} {isCurrentWeek ? '(Current)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="card-body">
                                {loading ? (
                                    <div className="text-center my-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                ) : (
                                    <div className="monthly-menu-container">
                                        {Object.entries(monthlyMenuData)
                                            .filter(([weekKey]) => {
                                                if (selectedWeek === 'all') return true;
                                                return weekKey === selectedWeek;
                                            })
                                            .map(([weekKey, weekData]) => (
                                            <div key={weekKey} className="mb-4">
                                                <h6 className={`mb-3 d-flex align-items-center ${parseInt(weekKey.replace('week', '')) === currentWeek ? 'text-success' : 'text-primary'}`}>
                                                    <i className="bi bi-calendar-week me-2"></i>
                                                    {weekKey.charAt(0).toUpperCase() + weekKey.slice(1)}
                                                    {parseInt(weekKey.replace('week', '')) === currentWeek && (
                                                        <span className="badge bg-success ms-2">
                                                            <i className="bi bi-clock me-1"></i>
                                                            Current Week
                                                        </span>
                                                    )}
                                                </h6>
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-hover" style={{ fontSize: '0.85rem' }}>
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th scope="col" className="text-center" style={{ width: '12%' }}>Day</th>
                                                                <th scope="col" className="text-center" style={{ width: '22%' }}>
                                                                    <i className="bi bi-sunrise me-2 text-warning"></i>
                                                                    Breakfast
                                                                </th>
                                                                <th scope="col" className="text-center" style={{ width: '22%' }}>
                                                                    <i className="bi bi-sun me-2 text-warning"></i>
                                                                    Lunch
                                                                </th>
                                                                <th scope="col" className="text-center" style={{ width: '22%' }}>
                                                                    <i className="bi bi-cup-hot me-2 text-warning"></i>
                                                                    Snacks
                                                                </th>
                                                                <th scope="col" className="text-center" style={{ width: '22%' }}>
                                                                    <i className="bi bi-moon me-2 text-warning"></i>
                                                                    Dinner
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(weekData).map(([dayKey, dayData]) => (
                                                                <tr key={dayKey}>
                                                                    <td className="fw-bold text-center align-middle text-capitalize">
                                                                        {dayKey}
                                                                    </td>
                                                                    <td
                                                                        className="align-middle clickable-cell"
                                                                        style={{
                                                                            padding: '8px',
                                                                            cursor: 'pointer',
                                                                            backgroundColor: selectedCell?.week === weekKey && selectedCell?.day === dayKey && selectedCell?.mealType === 'breakfast' ? '#e3f2fd' : 'transparent'
                                                                        }}
                                                                        onClick={() => handleCellClick(weekKey, dayKey, 'breakfast')}
                                                                    >
                                                                        <div className="meal-content" style={{
                                                                            fontSize: '0.8rem',
                                                                            lineHeight: '1.3',
                                                                            color: '#495057'
                                                                        }}>
                                                                            {dayData.breakfast}
                                                                        </div>
                                                                    </td>
                                                                    <td
                                                                        className="align-middle clickable-cell"
                                                                        style={{
                                                                            padding: '8px',
                                                                            cursor: 'pointer',
                                                                            backgroundColor: selectedCell?.week === weekKey && selectedCell?.day === dayKey && selectedCell?.mealType === 'lunch' ? '#e3f2fd' : 'transparent'
                                                                        }}
                                                                        onClick={() => handleCellClick(weekKey, dayKey, 'lunch')}
                                                                    >
                                                                        <div className="meal-content" style={{
                                                                            fontSize: '0.8rem',
                                                                            lineHeight: '1.3',
                                                                            color: '#495057'
                                                                        }}>
                                                                            {dayData.lunch}
                                                                        </div>
                                                                    </td>
                                                                    <td
                                                                        className="align-middle clickable-cell"
                                                                        style={{
                                                                            padding: '8px',
                                                                            cursor: 'pointer',
                                                                            backgroundColor: selectedCell?.week === weekKey && selectedCell?.day === dayKey && selectedCell?.mealType === 'snacks' ? '#e3f2fd' : 'transparent'
                                                                        }}
                                                                        onClick={() => handleCellClick(weekKey, dayKey, 'snacks')}
                                                                    >
                                                                        <div className="meal-content" style={{
                                                                            fontSize: '0.8rem',
                                                                            lineHeight: '1.3',
                                                                            color: '#495057'
                                                                        }}>
                                                                            {dayData.snacks}
                                                                        </div>
                                                                    </td>
                                                                    <td
                                                                        className="align-middle clickable-cell"
                                                                        style={{
                                                                            padding: '8px',
                                                                            cursor: 'pointer',
                                                                            backgroundColor: selectedCell?.week === weekKey && selectedCell?.day === dayKey && selectedCell?.mealType === 'dinner' ? '#e3f2fd' : 'transparent'
                                                                        }}
                                                                        onClick={() => handleCellClick(weekKey, dayKey, 'dinner')}
                                                                    >
                                                                        <div className="meal-content" style={{
                                                                            fontSize: '0.8rem',
                                                                            lineHeight: '1.3',
                                                                            color: '#495057'
                                                                        }}>
                                                                            {dayData.dinner}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-muted small mt-3">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Last updated: {new Date().toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'feedback' && (
                <div>
                    {/* Feedback Filters */}
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-funnel me-2"></i>
                                Feedback Filters
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label">Date Range</label>
                                    <select
                                        className="form-select"
                                        value={feedbackFilters.dateFilter}
                                        onChange={(e) => handleFeedbackFilterChange('dateFilter', e.target.value)}
                                    >
                                        <option value="today">Today</option>
                                        <option value="yesterday">Yesterday</option>
                                        <option value="thisWeek">This Week</option>
                                        <option value="lastWeek">Last Week</option>
                                        <option value="thisMonth">This Month</option>
                                        <option value="lastMonth">Last Month</option>
                                        <option value="thisYear">This Year</option>
                                        <option value="lastYear">Last Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>

                                {feedbackFilters.dateFilter === 'custom' && (
                                    <>
                                        <div className="col-md-2">
                                            <label className="form-label">Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={feedbackFilters.customStartDate}
                                                onChange={(e) => handleFeedbackFilterChange('customStartDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label">End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={feedbackFilters.customEndDate}
                                                onChange={(e) => handleFeedbackFilterChange('customEndDate', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="col-md-3">
                                    <label className="form-label">Meal Type</label>
                                    <select
                                        className="form-select"
                                        value={feedbackFilters.mealType}
                                        onChange={(e) => handleFeedbackFilterChange('mealType', e.target.value)}
                                    >
                                        <option value="all">All Meals</option>
                                        <option value="breakfast">Breakfast Only</option>
                                        <option value="lunch">Lunch Only</option>
                                        <option value="snacks">Snacks Only</option>
                                        <option value="dinner">Dinner Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Statistics */}
                    <div className="row g-4 mb-4">
                        {mealTypes.map(mt => (
                            <div className="col-md-3" key={mt}>
                                <div className={`card bg-${getRatingColor(todayAvgByMeal[mt].averageRating)} text-white h-100`}>
                                    <div className="card-body">
                                        <h5 className="card-title text-capitalize">{mt}</h5>
                                        <div className="d-flex align-items-center">
                                            <h2 className="display-4 me-2">{todayAvgByMeal[mt].count ? todayAvgByMeal[mt].averageRating.toFixed(1) : '—'}</h2>
                                            {todayAvgByMeal[mt].count ? renderStars(todayAvgByMeal[mt].averageRating) : <small className="text-light">No reviews</small>}
                                        </div>
                                        <p className="card-text">Based on {todayAvgByMeal[mt].count} reviews</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rating Distribution and Trends Charts */}
                    {feedbackStats && (
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card h-100">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Rating Distribution</h5>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ height: '300px' }}>
                                            <Pie
                                                data={{
                                                    labels: ['1 Stars','2 Stars','3 Stars','4 Stars','5 Stars'],
                                                    datasets: [
                                                        {
                                                            data: todayRatingDistribution,
                                                            backgroundColor: [
                                                                '#dc3545', // 1 star - danger
                                                                '#fd7e14', // 2 stars - orange
                                                                '#ffc107', // 3 stars - warning
                                                                '#0dcaf0', // 4 stars - info
                                                                '#198754', // 5 stars - success
                                                            ],
                                                            borderWidth: 1,
                                                        },
                                                    ],
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => {
                                                                    const label = context.label || '';
                                                                    const value = context.raw || 0;
                                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                    const percentage = Math.round((value / total) * 100);
                                                                    return `${label}: ${value} (${percentage}%)`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Progress bars for each rating */}
                                        <div className="mt-4">
                                            {todayRatingDistribution.map((count, idx) => {
                                                const percentage = totalTodayReviews ? (count / totalTodayReviews) * 100 : 0;
                                                const star = idx + 1;
                                                return (
                                                    <div className="mb-2" key={star}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span>{star} Stars</span>
                                                            <span>{count} reviews ({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '10px' }}>
                                                            <div
                                                                className={`progress-bar bg-${getRatingColor(star)}`}
                                                                role="progressbar"
                                                                style={{ width: `${percentage}%` }}
                                                                aria-valuenow={percentage}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Recent Trends (Last 7 Days)</h5>
                                    </div>
                                    <div className="card-body">
                                        {/* Group trends by date and meal type for the chart */}
                                        {(() => {
                                            // Process data for the chart using client-side recentTrendsFromFeedback
                                            const trendsByMeal = {};
                                            const dates = [...new Set(recentTrendsFromFeedback.map(t => t._id.date))].sort();

                                            // Initialize meal types
                                            recentTrendsFromFeedback.forEach(trend => {
                                                if (!trendsByMeal[trend._id.mealType]) {
                                                    trendsByMeal[trend._id.mealType] = {
                                                        label: trend._id.mealType.charAt(0).toUpperCase() + trend._id.mealType.slice(1),
                                                        data: [],
                                                        borderColor: trend._id.mealType === 'breakfast' ? '#fd7e14' :
                                                                    trend._id.mealType === 'lunch' ? '#0d6efd' :
                                                                    trend._id.mealType === 'snacks' ? '#6f42c1' : '#198754',
                                                        backgroundColor: trend._id.mealType === 'breakfast' ? 'rgba(253, 126, 20, 0.2)' :
                                                                        trend._id.mealType === 'lunch' ? 'rgba(13, 110, 253, 0.2)' :
                                                                        trend._id.mealType === 'snacks' ? 'rgba(111, 66, 193, 0.2)' : 'rgba(25, 135, 84, 0.2)',
                                                    };
                                                }
                                            });

                                            // Fill in data for each date
                                            dates.forEach(date => {
                                                Object.keys(trendsByMeal).forEach(mealType => {
                                                    const trend = recentTrendsFromFeedback.find(t =>
                                                        t._id.date === date && t._id.mealType === mealType
                                                    );

                                                    trendsByMeal[mealType].data.push(
                                                        trend ? trend.averageRating : null
                                                    );
                                                });
                                            });

                                            return (
                                                <div style={{ height: '300px' }}>
                                                    <Line
                                                        data={{
                                                            labels: dates.map(d => new Date(d).toLocaleDateString()),
                                                            datasets: Object.values(trendsByMeal),
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                y: {
                                                                    min: 1,
                                                                    max: 5,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Average Rating'
                                                                    }
                                                                }
                                                            },
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom',
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: (context) => {
                                                                            const label = context.dataset.label || '';
                                                                            const value = context.raw !== null ? context.raw.toFixed(1) : 'No data';
                                                                            return `${label}: ${value}`;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}

                                        {/* Table with detailed data — 7 rows, one per date */}
                                        <div className="table-responsive mt-4">
                                            <table className="table table-sm table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Breakfast</th>
                                                        <th>Lunch</th>
                                                        <th>Snacks</th>
                                                        <th>Dinner</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentDates.slice().reverse().map((date) => (
                                                        <tr key={date}>
                                                            <td>{new Date(date).toLocaleDateString()}</td>
                                                            {mealTypes.map(mt => (
                                                                <td key={mt} className="text-capitalize">
                                                                    {recentByDate[date] && recentByDate[date][mt] !== null ? (
                                                                        <>
                                                                            <span className={`badge bg-${getRatingColor(recentByDate[date][mt])}`}>
                                                                                {recentByDate[date][mt].toFixed(1)}
                                                                            </span>
                                                                            {' '}
                                                                            {renderStars(recentByDate[date][mt])}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-muted">No data</span>
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Charts Row */}
                    {feedbackStats && (
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card h-100">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Meal Type Comparison (Bar Chart)</h5>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ height: '300px' }}>
                                            <Bar
                                                data={{
                                                    labels: mealTypes.map(mt => mt.charAt(0).toUpperCase() + mt.slice(1)),
                                                    datasets: [
                                                        {
                                                            label: 'Average Rating',
                                                            data: mealTypes.map(mt => todayAvgByMeal[mt].averageRating || 0),
                                                            backgroundColor: [
                                                                'rgba(255, 99, 132, 0.8)',
                                                                'rgba(54, 162, 235, 0.8)',
                                                                'rgba(255, 205, 86, 0.8)',
                                                                'rgba(75, 192, 192, 0.8)'
                                                            ],
                                                            borderColor: [
                                                                'rgb(255, 99, 132)',
                                                                'rgb(54, 162, 235)',
                                                                'rgb(255, 205, 86)',
                                                                'rgb(75, 192, 192)'
                                                            ],
                                                            borderWidth: 1
                                                        },
                                                        {
                                                            label: 'Review Count',
                                                            data: mealTypes.map(mt => todayAvgByMeal[mt].count || 0),
                                                            backgroundColor: 'rgba(153, 102, 255, 0.8)',
                                                            borderColor: 'rgb(153, 102, 255)',
                                                            borderWidth: 1,
                                                            yAxisID: 'y1'
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Ratings vs Review Count by Meal Type'
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            type: 'linear',
                                                            display: true,
                                                            position: 'left',
                                                            min: 0,
                                                            max: 5,
                                                            title: {
                                                                display: true,
                                                                text: 'Average Rating'
                                                            }
                                                        },
                                                        y1: {
                                                            type: 'linear',
                                                            display: true,
                                                            position: 'right',
                                                            min: 0,
                                                            title: {
                                                                display: true,
                                                                text: 'Number of Reviews'
                                                            },
                                                            grid: {
                                                                drawOnChartArea: false,
                                                            },
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Rating Histogram</h5>
                                    </div>
                                    <div className="card-body">
                                        <div style={{ height: '300px' }}>
                                            <Bar
                                                data={{
                                                    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                                                    datasets: [
                                                        {
                                                            label: 'Number of Reviews',
                                                            data: todayRatingDistribution,
                                                            backgroundColor: [
                                                                'rgba(220, 53, 69, 0.8)',
                                                                'rgba(253, 126, 20, 0.8)',
                                                                'rgba(255, 193, 7, 0.8)',
                                                                'rgba(13, 202, 240, 0.8)',
                                                                'rgba(25, 135, 84, 0.8)'
                                                            ],
                                                            borderColor: [
                                                                'rgb(220, 53, 69)',
                                                                'rgb(253, 126, 20)',
                                                                'rgb(255, 193, 7)',
                                                                'rgb(13, 202, 240)',
                                                                'rgb(25, 135, 84)'
                                                            ],
                                                            borderWidth: 1
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Distribution of Ratings'
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            title: {
                                                                display: true,
                                                                text: 'Number of Reviews'
                                                            }
                                                        },
                                                        x: {
                                                            title: {
                                                                display: true,
                                                                text: 'Rating'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback List */}
                    {/* <div className="card">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">Student Feedback</h5>
                        </div>
                        <div className="card-body">
                            {feedbackLoading ? (
                                <div className="text-center my-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : feedback.length === 0 ? (
                                <div className="alert alert-info" role="alert">
                                    No feedback received yet.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Meal</th>
                                                <th>Rating</th>
                                                <th>Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feedback.map(item => (
                                                <tr key={item._id}>
                                                    <td>{new Date(item.date).toLocaleDateString()}</td>
                                                    <td className="text-capitalize">{item.mealType}</td>
                                                    <td>
                                                        <span className={`badge bg-${getRatingColor(item.rating)}`}>
                                                            {item.rating}
                                                        </span>
                                                        {' '}
                                                        {renderStars(item.rating)}
                                                    </td>
                                                    <td>{item.feedback || <em className="text-muted">No comments</em>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div> */}
                </div>
            )}


            {activeTab === 'count' && (
                <FoodCountManager />
            )}

            {activeTab === 'students' && (
                <StudentFoodManager />
            )}
        </div>
    );
};

export default Food;
