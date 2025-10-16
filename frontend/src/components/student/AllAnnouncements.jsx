// AllAnnouncements.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ErrorBoundary from './ErrorBoundary';

const AllAnnouncements = () => {
    const [allAnnouncements, setAllAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllAnnouncements = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/student-api/all-announcements`);
                setAllAnnouncements(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching all announcements:', error);
                setError('Failed to load announcements');
                setLoading(false);
            }
        };

        fetchAllAnnouncements();
    }, []);

    // Helper function to check if text needs truncation (approximately 3 lines = 200 characters)
    const shouldTruncate = (text) => text.length > 200;

    // Helper function to truncate text to 3 lines
    const truncateText = (text, maxLength = 200) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    const handleReadMore = (announcementId) => {
        const newExpanded = new Set(expandedAnnouncements);
        if (newExpanded.has(announcementId)) {
            newExpanded.delete(announcementId);
        } else {
            newExpanded.add(announcementId);
        }
        setExpandedAnnouncements(newExpanded);
    };

    if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;

    const announcementsContent = (
        <div className="announcements-list">
            {Array.isArray(allAnnouncements) && allAnnouncements.length > 0 ? (
                allAnnouncements.map((announcement) => {
                    const isExpanded = expandedAnnouncements.has(announcement._id);
                    const needsTruncation = shouldTruncate(announcement.description);
                    
                    return (
                        <div key={announcement._id} className="announcement-card">
                            <div className="announcement-card-body">
                                <h5 className="announcement-card-title">{announcement.title}</h5>
                                <p className="announcement-card-text">
                                    {isExpanded || !needsTruncation 
                                        ? announcement.description 
                                        : truncateText(announcement.description)
                                    }
                                </p>
                                {needsTruncation && (
                                    <button 
                                        className="read-more-btn"
                                        onClick={() => handleReadMore(announcement._id)}
                                    >
                                        {isExpanded ? 'Read Less' : 'Read More'}
                                    </button>
                                )}
                                <small className="announcement-card-date">
                                    Posted at: {new Date(announcement.createdAt).toLocaleString()}
                                </small>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="no-announcements">No announcements available.</p>
            )}
        </div>
    );

    return (
        <ErrorBoundary>
            {announcementsContent}
        </ErrorBoundary>
    );
};

export default AllAnnouncements;