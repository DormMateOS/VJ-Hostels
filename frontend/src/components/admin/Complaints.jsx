import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';

const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAdmin();

    useEffect(() => {
        fetchComplaints();
    }, [activeTab, token]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'active' ? 'get-active-complaints' : 'get-complaints';
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // If we're getting all complaints, filter based on the active tab
            if (endpoint === 'get-complaints') {
                const filteredComplaints = activeTab === 'active'
                    ? response.data.filter(complaint => complaint.status === 'active')
                    : response.data.filter(complaint => complaint.status === 'solved');
                setComplaints(filteredComplaints);
            } else {
                setComplaints(response.data);
            }

            setError('');
        } catch (err) {
            setError('Failed to load complaints');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsSolved = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/admin-api/mark-complaint-solved/${id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchComplaints();
        } catch (err) {
            setError('Failed to update complaint status');
            console.error(err);
        }
    };

    const filteredComplaints = complaints.filter(complaint =>
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.complaintBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryBadgeClass = (category) => {
        const categoryMap = {
            'network related': 'bg-info',
            'food': 'bg-warning text-dark',
            'water': 'bg-primary',
            'power cut': 'bg-danger',
            'cleaning': 'bg-success',
            'plumbing related': 'bg-secondary',
            'electrician related': 'bg-danger',
            'carpenter related': 'bg-dark'
        };

        return categoryMap[category] || 'bg-secondary';
    };

    return (
        <div>
            <h2 className="mb-4">Complaints Management</h2>

            <div className="card">
                <div className="card-header bg-light">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                Active Complaints
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'solved' ? 'active' : ''}`}
                                onClick={() => setActiveTab('solved')}
                            >
                                Solved Complaints
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by category, description, or student name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

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
                    ) : filteredComplaints.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                            No complaints found.
                        </div>
                    ) : (
                        <div className="list-group">
                            {filteredComplaints.map(complaint => (
                                <div key={complaint._id} className="list-group-item list-group-item-action">
                                    <div className="d-flex w-100 justify-content-between align-items-center">
                                        <div>
                                            <span className={`badge ${getCategoryBadgeClass(complaint.category)} me-2`}>
                                                {complaint.category}
                                            </span>
                                            <span className="text-muted">
                                                Reported by: {complaint.complaintBy}
                                            </span>
                                        </div>
                                        <small>{new Date(complaint.createdAt).toLocaleString()}</small>
                                    </div>
                                    <p className="mt-2 mb-1">{complaint.description}</p>

                                    {complaint.images && complaint.images.length > 0 && (
                                        <div className="mt-2 mb-3">
                                            <p className="mb-1"><strong>Attached Images:</strong></p>
                                            <div className="d-flex flex-wrap gap-2">
                                                {complaint.images.map((image, index) => (
                                                    <img
                                                        key={index}
                                                        src={image}
                                                        alt={`Complaint image ${index + 1}`}
                                                        className="img-thumbnail"
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                        <span className={`badge ${complaint.status === 'active' ? 'bg-danger' : 'bg-success'}`}>
                                            {complaint.status}
                                        </span>

                                        {complaint.status === 'active' && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleMarkAsSolved(complaint._id)}
                                            >
                                                Mark as Solved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Complaints;
