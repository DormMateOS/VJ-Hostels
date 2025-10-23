import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

const SecurityDashboard = () => {
    const [stats, setStats] = useState({
        approvedCount: 0,
        outCount: 0,
        returnedTodayCount: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/outpass-api/security-stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    <Shield size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                    Security Dashboard
                </h1>
                <p style={{ color: '#666', fontSize: '1rem' }}>
                    Monitor and manage student outpasses in real-time
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Approved Passes */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #4CAF50'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                Approved Passes
                            </p>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                                {stats.approvedCount}
                            </h2>
                        </div>
                        <CheckCircle size={48} color="#4CAF50" />
                    </div>
                </div>

                {/* Currently Out */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #FF9800'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                Currently Out
                            </p>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                                {stats.outCount}
                            </h2>
                        </div>
                        <Clock size={48} color="#FF9800" />
                    </div>
                </div>

                {/* Returned Today */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #2196F3'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                Returned Today
                            </p>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                                {stats.returnedTodayCount}
                            </h2>
                        </div>
                        <TrendingUp size={48} color="#2196F3" />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '1.5rem'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Activity</h2>
                
                {stats.recentActivity.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                        No recent activity
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Roll Number</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Out Time</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>In Time</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentActivity.map((activity) => (
                                    <tr key={activity._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{activity.name}</td>
                                        <td style={{ padding: '12px' }}>{activity.rollNumber}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                color: '#fff',
                                                backgroundColor: 
                                                    activity.status === 'approved' ? '#4CAF50' :
                                                    activity.status === 'out' ? '#FF9800' :
                                                    activity.status === 'returned' ? '#9C27B0' : '#666'
                                            }}>
                                                {activity.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {activity.actualOutTime ? 
                                                new Date(activity.actualOutTime).toLocaleString() : 
                                                '-'}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {activity.actualInTime ? 
                                                new Date(activity.actualInTime).toLocaleString() : 
                                                '-'}
                                        </td>
                                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                                            {activity.type}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ 
                marginTop: '2rem', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
            }}>
                <a 
                    href="/security/scanner" 
                    style={{
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Start QR Scanning
                </a>
                
                <a 
                    href="/security/passes" 
                    style={{
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    View All Passes
                </a>
            </div>
        </div>
    );
};

export default SecurityDashboard;
