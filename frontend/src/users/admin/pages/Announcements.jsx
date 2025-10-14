import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { token } = useAdmin();

    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, [token]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/all-announcements`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAnnouncements(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load announcements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_SERVER_URL}/admin-api/edit-announcement/${editingId}`,
                    { description: formData.description },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } else {
                await axios.post(`${import.meta.env.VITE_SERVER_URL}/admin-api/post-announcement`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            }

            fetchAnnouncements();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save announcement');
            console.error(err);
        }
    };

    const handleEdit = (announcement) => {
        setFormData({
            title: announcement.title,
            description: announcement.description
        });
        setEditingId(announcement._id);
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Announcements</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? 'Cancel' : 'Create Announcement'}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="card mb-4">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    disabled={editingId}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    id="description"
                                    name="description"
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                ></textarea>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Announcement' : 'Post Announcement'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">All Announcements</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center my-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                            No announcements found.
                        </div>
                    ) : (
                        <div className="list-group">
                            {announcements.map(announcement => (
                                <div key={announcement._id} className="list-group-item list-group-item-action">
                                    <div className="d-flex w-100 justify-content-between">
                                        <h5 className="mb-1">{announcement.title}</h5>
                                        <small>{new Date(announcement.createdAt).toLocaleString()}</small>
                                    </div>
                                    <p className="mb-1">{announcement.description}</p>
                                    <div className="d-flex justify-content-end mt-2">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleEdit(announcement)}
                                        >
                                            Edit
                                        </button>
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

export default Announcements;
