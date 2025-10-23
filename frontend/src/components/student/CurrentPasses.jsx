import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Clock, Calendar, Phone, User, FileText } from 'lucide-react';
import useCurrentUser from '../../hooks/student/useCurrentUser';
import { generateOutpassPDF } from '../../utils/outpassPDF';
import ErrorBoundary from './ErrorBoundary';

const CurrentPasses = () => {
    const { user, loading: userLoading } = useCurrentUser();
    const [currentPasses, setCurrentPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrentPasses = async () => {
            if (userLoading) {
                return;
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
                
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/student-api/all-outpasses/${user.rollNumber}`
                );
                
                // Filter for approved and out status only
                const activePasses = response.data.studentOutpasses?.filter(
                    pass => pass.status === 'approved' || pass.status === 'out'
                ) || [];
                
                setCurrentPasses(activePasses);
            } catch (err) {
                console.error('Error fetching current passes:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch current passes');
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentPasses();
    }, [user, userLoading]);

    const handleDownloadPDF = (pass) => {
        try {
            generateOutpassPDF(pass);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading current passes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#ffebee', borderRadius: '8px' }}>
                <p style={{ color: '#d32f2f' }}>{error}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                <p style={{ color: '#e65100' }}>Please log in to view your passes</p>
            </div>
        );
    }

    if (currentPasses.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p style={{ color: '#666' }}>No active passes found. Apply for an outpass to see it here once approved.</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>
                    Current Active Passes
                </h2>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {currentPasses.map((pass) => (
                        <div key={pass._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>Outpass - {pass.type}</h3>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor: pass.status === 'approved' ? '#4CAF50' : '#FF9800'
                                }}>
                                    {pass.status === 'approved' ? 'APPROVED' : 'OUT'}
                                </span>
                            </div>

                            <div style={styles.cardBody}>
                                <div style={styles.infoSection}>
                                    <div style={styles.infoRow}>
                                        <User size={18} color="#666" />
                                        <div>
                                            <span style={styles.label}>Student Name:</span>
                                            <span style={styles.value}>{pass.name}</span>
                                        </div>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <FileText size={18} color="#666" />
                                        <div>
                                            <span style={styles.label}>Roll Number:</span>
                                            <span style={styles.value}>{pass.rollNumber}</span>
                                        </div>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <Phone size={18} color="#666" />
                                        <div>
                                            <span style={styles.label}>Parent's Phone:</span>
                                            <span style={styles.value}>{pass.parentMobileNumber}</span>
                                        </div>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <Calendar size={18} color="#666" />
                                        <div>
                                            <span style={styles.label}>Out Time:</span>
                                            <span style={styles.value}>
                                                {new Date(pass.outTime).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.infoRow}>
                                        <Clock size={18} color="#666" />
                                        <div>
                                            <span style={styles.label}>In Time:</span>
                                            <span style={styles.value}>
                                                {new Date(pass.inTime).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={styles.reasonBox}>
                                        <span style={styles.label}>Reason:</span>
                                        <p style={styles.reason}>{pass.reason}</p>
                                    </div>

                                    {pass.actualOutTime && (
                                        <div style={{ ...styles.infoRow, backgroundColor: '#fff3e0', padding: '8px', borderRadius: '4px' }}>
                                            <Clock size={18} color="#ff9800" />
                                            <div>
                                                <span style={styles.label}>Actually Left At:</span>
                                                <span style={styles.value}>
                                                    {new Date(pass.actualOutTime).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {pass.qrCodeData && (
                                    <div style={styles.qrSection}>
                                        <div style={styles.qrContainer}>
                                            <QRCodeSVG 
                                                value={pass.qrCodeData} 
                                                size={160}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                        <p style={styles.qrText}>Show this QR code at the gate</p>
                                    </div>
                                )}
                            </div>

                            <div style={styles.cardFooter}>
                                <button 
                                    onClick={() => handleDownloadPDF(pass)}
                                    style={styles.downloadButton}
                                >
                                    <Download size={18} />
                                    <span>Download Pass</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ErrorBoundary>
    );
};

const styles = {
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
    },
    cardHeader: {
        backgroundColor: '#333',
        color: '#fff',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        margin: 0,
        fontSize: '1.1rem',
        textTransform: 'capitalize',
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: '#fff',
    },
    cardBody: {
        padding: '1.5rem',
    },
    infoSection: {
        marginBottom: '1.5rem',
    },
    infoRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px',
    },
    label: {
        display: 'block',
        fontSize: '0.85rem',
        color: '#666',
        fontWeight: '600',
        marginBottom: '2px',
    },
    value: {
        display: 'block',
        fontSize: '0.95rem',
        color: '#333',
    },
    reasonBox: {
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
    },
    reason: {
        margin: '8px 0 0 0',
        fontSize: '0.9rem',
        color: '#333',
        lineHeight: '1.5',
    },
    qrSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        marginTop: '1rem',
    },
    qrContainer: {
        padding: '12px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    qrText: {
        marginTop: '12px',
        fontSize: '0.9rem',
        color: '#666',
        textAlign: 'center',
    },
    cardFooter: {
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
    },
    downloadButton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#4CAF50',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
};

export default CurrentPasses;
