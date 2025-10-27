import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAdmin();

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/dashboard-stats`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setStats(response.data);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, [token]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div>
            <h2 className="mb-4">Dashboard</h2>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Total Students</h5>
                            <h2 className="display-4">{stats?.totalStudents || 0}</h2>
                            <p className="card-text">Active students in the hostel</p>
                        </div>
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <Link to="/admin/students" className="text-white text-decoration-none">View Details</Link>
                            <i className="bi bi-people fs-4"></i>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card bg-success text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Announcements</h5>
                            <h2 className="display-4">{stats?.totalAnnouncements || 0}</h2>
                            <p className="card-text">Total announcements made</p>
                        </div>
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <Link to="/admin/announcements" className="text-white text-decoration-none">View Details</Link>
                            <i className="bi bi-megaphone fs-4"></i>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card bg-warning text-dark h-100">
                        <div className="card-body">
                            <h5 className="card-title">Pending Outpasses</h5>
                            <h2 className="display-4">{stats?.pendingOutpassesCount || 0}</h2>
                            <p className="card-text">Outpasses waiting for approval</p>
                        </div>
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <Link to="/admin/outpasses" className="text-dark text-decoration-none">View Details</Link>
                            <i className="bi bi-box-arrow-right fs-4"></i>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card bg-danger text-white h-100">
                        <div className="card-body">
                            <h5 className="card-title">Active Complaints</h5>
                            <h2 className="display-4">{stats?.activeComplaintsCount || 0}</h2>
                            <p className="card-text">Complaints to be resolved</p>
                        </div>
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <Link to="/admin/complaints" className="text-white text-decoration-none">View Details</Link>
                            <i className="bi bi-exclamation-triangle fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <h5 className="card-title mb-0">Recent Complaints</h5>
                        </div>
                        <div className="card-body">
                            {stats?.recentComplaints?.length > 0 ? (
                                <div className="list-group">
                                    {stats.recentComplaints.map(complaint => (
                                        <div key={complaint._id} className="list-group-item list-group-item-action">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1">{complaint.category}</h6>
                                                <small className={`badge ${complaint.status === 'active' ? 'bg-danger' : 'bg-success'}`}>
                                                    {complaint.status}
                                                </small>
                                            </div>
                                            <p className="mb-1">{complaint.description.substring(0, 100)}...</p>
                                            <small>By: {complaint.complaintBy}</small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No recent complaints</p>
                            )}
                        </div>
                        <div className="card-footer">
                            <Link to="/admin/complaints" className="btn btn-sm btn-outline-primary">View All Complaints</Link>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <h5 className="card-title mb-0">Recent Outpass Requests</h5>
                        </div>
                        <div className="card-body">
                            {stats?.recentOutpasses?.length > 0 ? (
                                <div className="list-group">
                                    {stats.recentOutpasses.map(outpass => (
                                        <div key={outpass._id} className="list-group-item list-group-item-action">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1">{outpass.name}</h6>
                                                <small className={`badge ${
                                                    outpass.status === 'pending' ? 'bg-warning text-dark' :
                                                    outpass.status === 'accepted' ? 'bg-success' : 'bg-danger'
                                                }`}>
                                                    {outpass.status}
                                                </small>
                                            </div>
                                            <p className="mb-1">
                                                <strong>Type:</strong> {outpass.type} |
                                                <strong> Reason:</strong> {outpass.reason.substring(0, 50)}...
                                            </p>
                                            <small>
                                                <strong>Out:</strong> {new Date(outpass.outTime).toLocaleString()} |
                                                <strong> In:</strong> {new Date(outpass.inTime).toLocaleString()}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No recent outpass requests</p>
                            )}
                        </div>
                        <div className="card-footer">
                            <Link to="/admin/outpasses" className="btn btn-sm btn-outline-primary">View All Outpasses</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
