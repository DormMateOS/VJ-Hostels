import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FoodPauseManagerEnhanced from './FoodPauseManagerEnhanced';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const OutpassFoodIntegration = () => {
    const { user } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [outpassData, setOutpassData] = useState(null);
    const [showFoodPause, setShowFoodPause] = useState(false);

    useEffect(() => {
        // Check if redirected from outpass approval
        const urlParams = new URLSearchParams(location.search);
        const outpassId = urlParams.get('outpassId');
        const approved = urlParams.get('approved');

        if (outpassId && approved === 'true') {
            fetchOutpassData(outpassId);
        }
    }, [location]);

    const fetchOutpassData = async (outpassId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/outpass-api/details/${outpassId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setOutpassData(data);
                setShowFoodPause(true);
            }
        } catch (error) {
            console.error('Error fetching outpass data:', error);
        }
    };

    const handleFoodPauseComplete = () => {
        setShowFoodPause(false);
        setOutpassData(null);
        // Navigate back to dashboard or outpass page
        navigate('/student/dashboard');
    };

    const handleSkipFoodPause = () => {
        setShowFoodPause(false);
        setOutpassData(null);
        navigate('/student/dashboard');
    };

    if (!showFoodPause) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <i className="bi bi-check-circle-fill text-success mb-3" style={{ fontSize: '4rem' }}></i>
                                <h3 className="text-success mb-3">Outpass Approved Successfully!</h3>
                                <p className="text-muted mb-4">
                                    Your outpass has been approved. Would you like to pause your meals for the outpass duration?
                                </p>
                                <div className="d-flex gap-3 justify-content-center">
                                    <button 
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setShowFoodPause(true)}
                                    >
                                        <i className="bi bi-pause-circle me-2"></i>
                                        Pause Meals
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary btn-lg"
                                        onClick={handleSkipFoodPause}
                                    >
                                        <i className="bi bi-skip-forward me-2"></i>
                                        Skip for Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-12">
                    {/* Outpass Info Banner */}
                    {outpassData && (
                        <div className="alert alert-info border-0 shadow-sm mb-4">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                                <div>
                                    <h6 className="mb-1">Outpass Details</h6>
                                    <p className="mb-0">
                                        <strong>Duration:</strong> {new Date(outpassData.outTime).toLocaleDateString()} 
                                        to {new Date(outpassData.inTime).toLocaleDateString()} | 
                                        <strong> Reason:</strong> {outpassData.reason}
                                    </p>
                                </div>
                                <div className="ms-auto">
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={handleSkipFoodPause}
                                    >
                                        Skip & Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Food Pause Manager */}
                    <FoodPauseManagerEnhanced 
                        outpassData={outpassData}
                        onComplete={handleFoodPauseComplete}
                    />
                </div>
            </div>
        </div>
    );
};

export default OutpassFoodIntegration;
