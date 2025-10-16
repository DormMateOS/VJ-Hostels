import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const PostComplaint = () => {
    const { user, loading: userLoading } = useCurrentUser();
    const navigate = useNavigate();
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (userLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Please log in to post a complaint.</p>
            </div>
        );
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create form data to handle file upload
            const formData = new FormData();
            formData.append('category', category);
            formData.append('description', description);
            formData.append('complaintBy', user.rollNumber);

            // Add image if selected
            if (image) {
                formData.append('image', image);
            }

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/student-api/post-complaint`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert(response.data.message || 'Complaint submitted successfully!');
            navigate('/home');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Submit a Complaint</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="network related">Network Related</option>
                        <option value="food">Food</option>
                        <option value="water">Water</option>
                        <option value="power cut">Power Cut</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="plumbing related">Plumbing Related</option>
                        <option value="electrician related">Electrician Related</option>
                        <option value="carpenter related">Carpenter Related</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue"
                        required
                        rows="4"
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Attach Image (Optional)</label>
                    <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                    />

                    {imagePreview && (
                        <div className="mt-2" style={{ textAlign: 'center' }}>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '4px',
                                    border: '1px solid #dee2e6'
                                }}
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
            </form>
        </div>
    );
};

export default PostComplaint;
