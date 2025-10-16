import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../../hooks/student/useCurrentUser';

function Outpass() {
    const { user, loading } = useCurrentUser();
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const navigate = useNavigate();


    // console.log(user)

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Please log in to submit an outpass request.</p>
            </div>
        );
    }

    const onSubmit = async (data) => {
        try {
            if (!user?.phoneNumber || !user?.parentMobileNumber) {
                alert('Phone numbers are required. Please update your profile.');
                return;
            }

            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const payload = {
                ...data,
                name: user?.name,
                rollNumber: user?.rollNumber,
                studentMobileNumber: user?.phoneNumber,
                parentMobileNumber: user?.parentMobileNumber,
                month,
                year
            };

            console.log('Submitting Payload:', payload);

            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/student-api/apply-outpass`, payload);

            console.log('API Response:', response);
            alert(response.data.message || 'Outpass request submitted successfully!');

            reset();
            navigate('/home');
        } catch (error) {
            console.error('Error Details:', error);
            alert(error.response?.data?.message || 'Failed to submit outpass request');
        }
    };

    return (
        <div className="form-container responsive-form">
            <h2 className="form-title">Apply for Outpass</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label className="form-label">Out Time</label>
                    <input
                        type="datetime-local"
                        className="form-input"
                        {...register('outTime', { required: 'Out time is required' })}
                    />
                    {errors.outTime && <span className="error-message">{errors.outTime.message}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">In Time</label>
                    <input
                        type="datetime-local"
                        className="form-input"
                        {...register('inTime', { required: 'In time is required' })}
                    />
                    {errors.inTime && <span className="error-message">{errors.inTime.message}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">Reason for Outpass</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Enter reason for outpass request"
                        {...register('reason', { required: 'Reason is required', maxLength: 200 })}
                    />
                    {errors.reason && <span className="error-message">{errors.reason.message}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">Outpass Type</label>
                    <select
                        className="form-select"
                        {...register('type', { required: 'Type of outpass is required' })}
                    >
                        <option value="">Select Type</option>
                        <option value="late pass">Late Pass</option>
                        <option value="home pass">Home Pass</option>
                    </select>
                    {errors.type && <span className="error-message">{errors.type.message}</span>}
                </div>

                <button type="submit" className="form-button">Submit Outpass Request</button>
            </form>
        </div>
    );
}

export default Outpass;
