import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { QrCode, CheckCircle, XCircle, AlertCircle, User, Phone, Calendar, Clock } from 'lucide-react';

const QRScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [verifiedPass, setVerifiedPass] = useState(null);
    const [actionType, setActionType] = useState('out'); // 'out' or 'in'
    const html5QrCodeRef = useRef(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize scanner
        const initScanner = async () => {
            try {
                if (!scannerRef.current) return;
                
                html5QrCodeRef.current = new Html5Qrcode('qr-reader');
                startScanning();
            } catch (err) {
                console.error('Error initializing scanner:', err);
                setError('Failed to initialize camera');
            }
        };

        initScanner();

        // Cleanup
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            if (!html5QrCodeRef.current) return;
            
            setScanning(true);
            setError(null);
            
            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                handleScan,
                (errorMessage) => {
                    // Handle scan error - usually means no QR code in frame
                }
            );
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Failed to start camera. Please check permissions.');
            setScanning(false);
        }
    };

    const handleScan = async (decodedText, decodedResult) => {
        if (decodedText) {
            try {
                // Stop scanning temporarily
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                
                setScanning(false);
                setError(null);
                
                // First verify the QR code
                const verifyResponse = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/outpass-api/verify-qr`,
                    { qrCodeData: decodedText }
                );

                if (verifyResponse.data.valid) {
                    setVerifiedPass(verifyResponse.data.outpass);
                    setScanResult(decodedText);
                }
            } catch (err) {
                console.error('Error verifying QR code:', err);
                setError(err.response?.data?.message || 'Invalid QR code');
                setTimeout(() => {
                    setError(null);
                    startScanning();
                }, 3000);
            }
        }
    };

    const handleCheckOut = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/outpass-api/scan/out`,
                { qrCodeData: scanResult }
            );

            alert(`✅ ${response.data.message}\n\nStudent: ${response.data.student.name}\nTime: ${new Date(response.data.student.outTime).toLocaleString()}`);
            
            // Reset for next scan
            resetScanner();
        } catch (err) {
            console.error('Error during checkout:', err);
            alert(err.response?.data?.message || 'Failed to check out student');
            resetScanner();
        }
    };

    const handleCheckIn = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/outpass-api/scan/in`,
                { qrCodeData: scanResult }
            );

            alert(`✅ ${response.data.message}\n\nStudent: ${response.data.student.name}\nTime: ${new Date(response.data.student.inTime).toLocaleString()}`);
            
            // Reset for next scan
            resetScanner();
        } catch (err) {
            console.error('Error during checkin:', err);
            alert(err.response?.data?.message || 'Failed to check in student');
            resetScanner();
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setVerifiedPass(null);
        setError(null);
        startScanning();
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    <QrCode size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                    QR Code Scanner
                </h1>
                <p style={{ color: '#666', fontSize: '1rem' }}>
                    Scan student outpass QR codes for check-in/check-out
                </p>
            </div>

            {/* Action Type Selector */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '1rem', 
                marginBottom: '2rem' 
            }}>
                <button
                    onClick={() => setActionType('out')}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: actionType === 'out' ? '#4CAF50' : '#ddd',
                        backgroundColor: actionType === 'out' ? '#4CAF50' : '#fff',
                        color: actionType === 'out' ? '#fff' : '#333',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Check Out (Leaving)
                </button>
                <button
                    onClick={() => setActionType('in')}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: actionType === 'in' ? '#2196F3' : '#ddd',
                        backgroundColor: actionType === 'in' ? '#2196F3' : '#fff',
                        color: actionType === 'in' ? '#fff' : '#333',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Check In (Returning)
                </button>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '2rem',
                '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr'
                }
            }}>
                {/* Scanner Section */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Camera View</h2>
                    
                    <div 
                        ref={scannerRef}
                        id="qr-reader"
                        style={{ 
                            border: scanning ? '3px solid #4CAF50' : '3px solid #ddd', 
                            borderRadius: '12px', 
                            overflow: 'hidden',
                            width: '100%',
                            minHeight: '300px'
                        }}
                    >
                    </div>
                    
                    {!scanning && !error && verifiedPass && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            textAlign: 'center',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '12px'
                        }}>
                            <CheckCircle size={32} color="#4CAF50" />
                            <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#4CAF50' }}>QR Code Scanned Successfully!</p>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#ffebee',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <XCircle size={24} color="#d32f2f" />
                            <span style={{ color: '#d32f2f' }}>{error}</span>
                        </div>
                    )}

                    {!scanning && !error && (
                        <button
                            onClick={resetScanner}
                            style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#2196F3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Scan Another Code
                        </button>
                    )}
                </div>

                {/* Pass Details Section */}
                <div style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Pass Details</h2>
                    
                    {verifiedPass ? (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <User size={18} color="#666" />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Student Name</span>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{verifiedPass.name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <User size={18} color="#666" />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Roll Number</span>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{verifiedPass.rollNumber}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Calendar size={18} color="#666" />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Pass Type</span>
                                            <p style={{ margin: 0, fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {verifiedPass.type}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Clock size={18} color="#666" />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Scheduled Out Time</span>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                {new Date(verifiedPass.outTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Clock size={18} color="#666" />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Scheduled In Time</span>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                {new Date(verifiedPass.inTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: verifiedPass.status === 'approved' ? '#e8f5e9' : '#fff3e0',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <AlertCircle size={18} color={verifiedPass.status === 'approved' ? '#4CAF50' : '#FF9800'} />
                                        <div>
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Current Status</span>
                                            <p style={{ 
                                                margin: 0, 
                                                fontWeight: 'bold', 
                                                textTransform: 'uppercase',
                                                color: verifiedPass.status === 'approved' ? '#4CAF50' : '#FF9800'
                                            }}>
                                                {verifiedPass.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Reason</span>
                                    <p style={{ margin: '8px 0 0 0' }}>{verifiedPass.reason}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {actionType === 'out' && verifiedPass.status === 'approved' && (
                                    <button
                                        onClick={handleCheckOut}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            backgroundColor: '#4CAF50',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <CheckCircle size={20} />
                                        Approve Exit
                                    </button>
                                )}

                                {actionType === 'in' && verifiedPass.status === 'out' && (
                                    <button
                                        onClick={handleCheckIn}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            backgroundColor: '#2196F3',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <CheckCircle size={20} />
                                        Approve Entry
                                    </button>
                                )}

                                {((actionType === 'out' && verifiedPass.status !== 'approved') ||
                                  (actionType === 'in' && verifiedPass.status !== 'out')) && (
                                    <div style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: '#ffebee',
                                        color: '#d32f2f',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        <XCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                        Invalid Status for {actionType === 'out' ? 'Exit' : 'Entry'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: '#666'
                        }}>
                            <QrCode size={64} color="#ddd" />
                            <p style={{ marginTop: '1rem' }}>Scan a QR code to view pass details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
