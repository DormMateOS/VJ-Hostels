import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';

const StudentFoodManager = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [availableYears, setAvailableYears] = useState([]);
    const [hostelInfo, setHostelInfo] = useState(null);
    const [stats, setStats] = useState(null);
    const { token } = useAdmin();

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchTerm, statusFilter, yearFilter]);

    const fetchStudents = async () => {
        setLoading(true);
        setError('');
        
        try {
            const hostelId = 1; // This should come from admin context
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/food-api/students/${hostelId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setStudents(response.data.students);
                setHostelInfo(response.data.hostel);
                setStats({
                    total: response.data.total,
                    active: response.data.active,
                    paused: response.data.paused
                });
                
                // Extract available years for filtering
                const years = [...new Set(response.data.students
                    .map(student => student.year)
                    .filter(year => year && year.trim() !== '')
                )].sort();
                setAvailableYears(years);
                
                setError('');
            } else {
                throw new Error('Failed to fetch students');
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(`Failed to fetch students: ${err.response?.data?.error || err.message}`);
            setStudents([]);
            setHostelInfo(null);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = [...students];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(student => student.status === statusFilter);
        }

        // Filter by year
        if (yearFilter !== 'all') {
            filtered = filtered.filter(student => student.year === yearFilter);
        }

        setFilteredStudents(filtered);
    };

    const getFilteredStats = () => {
        return {
            total: filteredStudents.length,
            active: filteredStudents.filter(s => s.status === 'active').length,
            paused: filteredStudents.filter(s => s.status === 'paused').length
        };
    };

    const isFiltered = () => {
        return statusFilter !== 'all' || yearFilter !== 'all' || searchTerm.trim() !== '';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (student) => {
        if (student.status === 'paused') {
            return (
                <span className="badge bg-warning text-dark">
                    ⏸️ Paused {student.pause_until ? `until ${formatDate(student.pause_until)}` : ''}
                </span>
            );
        }
        return <span className="badge bg-success">✅ Active</span>;
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
                    {hostelInfo && (
                        <p className="text-muted mb-0">
                            <strong>{hostelInfo.hostel_name}</strong>
                            {hostelInfo.warden_name && ` • Warden: ${hostelInfo.warden_name}`}
                        </p>
                    )}
                </div>
                
                <button 
                    onClick={fetchStudents} 
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
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h6 className="card-title">Total Students</h6>
                                    <h3 className="mb-0">
                                        {isFiltered() ? getFilteredStats().total : (stats?.total || students.length)}
                                    </h3>
                                    {isFiltered() && (
                                        <small>of {stats?.total || students.length} total</small>
                                    )}
                                </div>
                                <div className="display-4 opacity-50">👥</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h6 className="card-title">Active</h6>
                                    <h3 className="mb-0">
                                        {isFiltered() ? getFilteredStats().active : (stats?.active || students.filter(s => s.status === 'active').length)}
                                    </h3>
                                </div>
                                <div className="display-4 opacity-50">✅</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-warning text-dark">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h6 className="card-title">Paused</h6>
                                    <h3 className="mb-0">
                                        {isFiltered() ? getFilteredStats().paused : (stats?.paused || students.filter(s => s.status === 'paused').length)}
                                    </h3>
                                </div>
                                <div className="display-4 opacity-50">⏸️</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Search and Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name, roll number, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="all">All Students</option>
                                <option value="active">Active Only</option>
                                <option value="paused">Paused Only</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="form-select"
                            >
                                <option value="all">All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(statusFilter !== 'all' || yearFilter !== 'all' || searchTerm) && (
                        <div className="mt-3">
                            <button 
                                onClick={() => {
                                    setStatusFilter('all');
                                    setYearFilter('all');
                                    setSearchTerm('');
                                }}
                                className="btn btn-outline-secondary btn-sm"
                            >
                                <i className="bi bi-x-circle me-2"></i>Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <div className="alert alert-info text-center" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    No students found matching your criteria.
                </div>
            ) : (
                <div className="card">
                    <div className="card-header bg-light">
                        <h5 className="mb-0">Students List ({filteredStudents.length})</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Student</th>
                                        <th>Roll Number</th>
                                        <th>Email</th>
                                        <th>Academic Info</th>
                                        <th>Status</th>
                                        <th>Paused Meals</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                         style={{ width: '40px', height: '40px' }}>
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{student.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code>{student.roll_number}</code>
                                            </td>
                                            <td>
                                                <small className="text-muted">{student.email}</small>
                                            </td>
                                            <td>
                                                {(student.year || student.degree) && (
                                                    <div>
                                                        {student.year && <span className="badge bg-light text-dark me-1">Year: {student.year}</span>}
                                                        {student.degree && <span className="badge bg-light text-dark">Degree: {student.degree}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(student)}
                                            </td>
                                            <td>
                                                {student.pause_meals ? (
                                                    <span className="text-warning">
                                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                                        {student.pause_meals}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 text-center">
                <button className="btn btn-outline-secondary">
                    <i className="bi bi-file-earmark-spreadsheet me-2"></i>Export Student List
                </button>
            </div>
        </div>
    );
};

export default StudentFoodManager;
