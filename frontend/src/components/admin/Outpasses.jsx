import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext';

const Outpasses = () => {
    const [outpasses, setOutpasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAdmin();

    useEffect(() => {
        fetchOutpasses();
    }, [token]);

    const fetchOutpasses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/pending-outpasses`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setOutpasses(response.data.pendingOutpasses || []);
            setError('');
        } catch (err) {
            setError('Failed to load outpasses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/admin-api/update-outpass-status/${id}`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            fetchOutpasses();
        } catch (err) {
            setError(`Failed to ${status} outpass`);
            console.error(err);
        }
    };

    const filteredOutpasses = outpasses.filter(outpass =>
        outpass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outpass.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outpass.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <h2 className="mb-4">Outpass Requests</h2>

            <div className="card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">Pending Outpass Requests</h5>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, roll number, or reason..."
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
                    ) : filteredOutpasses.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                            No pending outpass requests found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Roll Number</th>
                                        <th>Type</th>
                                        <th>Out Time</th>
                                        <th>In Time</th>
                                        <th>Reason</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOutpasses.map(outpass => (
                                        <tr key={outpass._id}>
                                            <td>{outpass.name}</td>
                                            <td>{outpass.rollNumber}</td>
                                            <td>
                                                <span className={`badge ${outpass.type === 'home pass' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                                    {outpass.type}
                                                </span>
                                            </td>
                                            <td>{new Date(outpass.outTime).toLocaleString()}</td>
                                            <td>{new Date(outpass.inTime).toLocaleString()}</td>
                                            <td>{outpass.reason}</td>
                                            <td>
                                                <div>Student: {outpass.studentMobileNumber}</div>
                                                <div>Parent: {outpass.parentMobileNumber}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleUpdateStatus(outpass._id, 'approved')}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleUpdateStatus(outpass._id, 'rejected')}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Outpasses;
