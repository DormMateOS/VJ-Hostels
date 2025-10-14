import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';
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
import FoodCountManager from '../components/FoodCountManager';
import StudentFoodManager from '../components/StudentFoodManager';

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

    useEffect(() => {
        if (activeTab === 'menu') {
            fetchMenus();
            fetchMonthlyMenu();
        } else if (activeTab === 'feedback') {
            fetchFeedback();
            fetchFeedbackStats();
        }
    }, [activeTab, token]);

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
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/admin/feedback`, {
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
                    <button
                        className={`btn ${activeTab === 'count' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActiveTab('count')}
                    >
                        <i className="bi bi-calculator me-2"></i>
                        Food Count
                    </button>
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
                    {/* Feedback Statistics */}
                    <div className="row g-4 mb-4">
                        {feedbackStats && feedbackStats.avgRatingsByMeal.map(stat => (
                            <div className="col-md-3" key={stat._id}>
                                <div className={`card bg-${getRatingColor(stat.averageRating)} text-white h-100`}>
                                    <div className="card-body">
                                        <h5 className="card-title text-capitalize">{stat._id}</h5>
                                        <div className="d-flex align-items-center">
                                            <h2 className="display-4 me-2">{stat.averageRating.toFixed(1)}</h2>
                                            {renderStars(stat.averageRating)}
                                        </div>
                                        <p className="card-text">Based on {stat.count} reviews</p>
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
                                                    labels: feedbackStats.ratingDistribution.map(r => `${r._id} Stars`),
                                                    datasets: [
                                                        {
                                                            data: feedbackStats.ratingDistribution.map(r => r.count),
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
                                            {feedbackStats.ratingDistribution.map(rating => {
                                                const percentage = (rating.count / feedback.length) * 100;
                                                return (
                                                    <div className="mb-2" key={rating._id}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span>{rating._id} Stars</span>
                                                            <span>{rating.count} reviews ({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '10px' }}>
                                                            <div
                                                                className={`progress-bar bg-${getRatingColor(rating._id)}`}
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
                                            // Process data for the chart
                                            const trendsByMeal = {};
                                            const dates = [...new Set(feedbackStats.recentTrends.map(t => t._id.date))].sort();

                                            // Initialize meal types
                                            feedbackStats.recentTrends.forEach(trend => {
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
                                                    const trend = feedbackStats.recentTrends.find(t =>
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

                                        {/* Table with detailed data */}
                                        <div className="table-responsive mt-4">
                                            <table className="table table-sm table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Meal Type</th>
                                                        <th>Avg. Rating</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {feedbackStats.recentTrends.map((trend, index) => (
                                                        <tr key={index}>
                                                            <td>{new Date(trend._id.date).toLocaleDateString()}</td>
                                                            <td className="text-capitalize">{trend._id.mealType}</td>
                                                            <td>
                                                                <span className={`badge bg-${getRatingColor(trend.averageRating)}`}>
                                                                    {trend.averageRating.toFixed(1)}
                                                                </span>
                                                                {' '}
                                                                {renderStars(trend.averageRating)}
                                                            </td>
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

                    {/* Feedback List */}
                    <div className="card">
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
                                                <th>Student</th>
                                                <th>Meal</th>
                                                <th>Rating</th>
                                                <th>Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feedback.map(item => (
                                                <tr key={item._id}>
                                                    <td>{new Date(item.date).toLocaleDateString()}</td>
                                                    <td>{item.studentName} ({item.studentId})</td>
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
                    </div>
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
