import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useCurrentUser from '../../hooks/student/useCurrentUser';
import ErrorBoundary from './ErrorBoundary';

const OutpassList = () => {
    const { user, loading: userLoading } = useCurrentUser();
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    console.log(user)

    useEffect(() => {
        const fetchOutpasses = async () => {
            if (userLoading) {
                return; // Wait for user to load
            }

            if (!user) {
                setError('User not found. Please log in.');
                setLoading(false);
                return;
            }
            try {
                if (!user?.rollNumber) {
                    throw new Error('User roll number is required');
                }
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/student-api/all-outpasses/${user.rollNumber}`);
                
                // Filter for returned and rejected passes only (history)
                const historyPasses = response.data.studentOutpasses?.filter(
                    pass => pass.status === 'returned' || pass.status === 'rejected' || pass.status === 'pending'
                ) || [];
                
                setOutpasses(historyPasses);
            } catch (err) {
                console.error('Error fetching outpasses:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch outpasses');
            } finally {
                setLoading(false);
            }
        };

        fetchOutpasses();
    }, [user, userLoading]);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading outpasses...</p>
        </div>
    );
    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#ffebee', borderRadius: '8px' }}>
            <p style={{ color: '#d32f2f' }}>{error}</p>
        </div>
    );
    if (!user) return (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
            <p style={{ color: '#e65100' }}>Please log in to view your outpasses</p>
        </div>
    );
    if (outpasses.length === 0) return (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ color: '#666' }}>No outpass requests found.</p>
        </div>
    );

    return (
        <ErrorBoundary>
            <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>My Outpass Requests</h2>

                {/* Desktop Table View */}
                <div className="table-container">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr style={{ backgroundColor: '#333', color: '#fff' }}>
                                    <th style={styles.th}>Out Time</th>
                                    <th style={styles.th}>In Time</th>
                                    <th style={styles.th}>Reason</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outpasses.map((outpass) => (
                                    <tr key={outpass._id} style={styles.tr}>
                                        <td style={styles.td}>{new Date(outpass.outTime).toLocaleString()}</td>
                                        <td style={styles.td}>{new Date(outpass.inTime).toLocaleString()}</td>
                                        <td style={styles.td}>{outpass.reason}</td>
                                        <td style={styles.td}>{outpass.type}</td>
                                        <td style={{ ...styles.td, color: getStatusColor(outpass.status) }}>
                                            <span className={`status-badge status-${outpass.status.toLowerCase()}`}>
                                                {outpass.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-card-list">
                        {outpasses.map((outpass) => (
                            <div key={outpass._id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <h3 className="mobile-card-title">Outpass Request</h3>
                                    <span className={`status-badge status-${outpass.status.toLowerCase()}`}>
                                        {outpass.status}
                                    </span>
                                </div>
                                <div className="mobile-card-content">
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">Out Time:</span>
                                        <span className="mobile-card-value">
                                            {new Date(outpass.outTime).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">In Time:</span>
                                        <span className="mobile-card-value">
                                            {new Date(outpass.inTime).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">Reason:</span>
                                        <span className="mobile-card-value">{outpass.reason}</span>
                                    </div>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">Type:</span>
                                        <span className="mobile-card-value">{outpass.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return '#FFA500';
        case 'approved': return '#4CAF50';
        case 'rejected': return '#FF0000';
        case 'out': return '#2196F3';
        case 'returned': return '#9C27B0';
        default: return '#000';
    }
};

const styles = {
    th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #555' },
    td: { padding: '10px', borderBottom: '1px solid #ccc' },
    tr: { backgroundColor: '#f9f9f9' },
};

export default OutpassList;
