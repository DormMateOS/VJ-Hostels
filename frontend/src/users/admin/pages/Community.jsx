import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';
import AdminChat from '../components/AdminChat';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('chat');
    const { token } = useAdmin();

    useEffect(() => {
        fetchCommunityPosts();
    }, [token]);

    const fetchCommunityPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/get-community-messages`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPosts(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load community posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryBadgeClass = (category) => {
        const categoryMap = {
            'general': 'bg-primary',
            'missing item': 'bg-warning text-dark',
            'interchanged clothes': 'bg-info text-dark'
        };

        return categoryMap[category] || 'bg-secondary';
    };

    const filteredPosts = posts.filter(post => {
        // Apply search filter
        const matchesSearch =
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.postedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.postedBy.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply category filter
        const matchesCategory = filter === 'all' || post.category === filter;

        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <h2 className="mb-4">Community Management</h2>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <i className="bi bi-chat-dots me-2"></i>
                        Real-time Chat
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <i className="bi bi-card-text me-2"></i>
                        Community Posts
                    </button>
                </li>
            </ul>

            {activeTab === 'chat' ? (
                <AdminChat />
            ) : (
                <div className="card">
                    <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">All Community Posts</h5>
                            <div className="d-flex gap-2">
                                <select
                                    className="form-select form-select-sm"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">All Categories</option>
                                    <option value="general">General</option>
                                    <option value="missing item">Missing Item</option>
                                    <option value="interchanged clothes">Interchanged Clothes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by content or student name..."
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
                        ) : filteredPosts.length === 0 ? (
                            <div className="alert alert-info" role="alert">
                                No community posts found.
                            </div>
                        ) : (
                            <div className="list-group">
                                {filteredPosts.map(post => (
                                    <div key={post._id} className="list-group-item">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div>
                                                <strong>{post.postedBy.name}</strong>
                                                <span className="text-muted ms-2">({post.postedBy.rollNumber})</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span className={`badge ${getCategoryBadgeClass(post.category)} me-2`}>
                                                    {post.category}
                                                </span>
                                                <small className="text-muted">
                                                    {new Date(post.createdAt).toLocaleString()}
                                                </small>
                                            </div>
                                        </div>
                                        <p className="mb-3">{post.content}</p>

                                        {post.images && post.images.length > 0 && (
                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                {post.images.map((image, index) => (
                                                    <img
                                                        key={index}
                                                        src={image}
                                                        alt={`Post image ${index + 1}`}
                                                        className="img-thumbnail"
                                                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
