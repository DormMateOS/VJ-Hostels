import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../context/AdminContext';
import StudentDetailsModal from '../components/StudentDetailsModal';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAdmin();

    // For student details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRollNumber, setSelectedRollNumber] = useState('');



    // For student registration form
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        branch: '',
        year: '',
        phoneNumber: '',
        email: '',
        parentMobileNumber: '',
        roomNumber: '',
        password: ''
    });

    // For available rooms in the registration form
    const [availableRooms, setAvailableRooms] = useState([]);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [activeTab, token]);

    useEffect(() => {
        if (showForm) {
            fetchAvailableRooms();
        }
    }, [showForm, token]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'active' ? 'get-active-students' : 'get-inactive-students';
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setStudents(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load students');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateStudent = async (rollNumber) => {
        if (!window.confirm('Are you sure you want to deactivate this student? This will also unassign them from their room.')) {
            return;
        }

        try {
            const response = await axios.put(`${import.meta.env.VITE_SERVER_URL}/admin-api/student-delete`,
                { rollNumber },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            alert(response.data.message);
            fetchStudents();
        } catch (err) {
            setError('Failed to deactivate student');
            console.error(err);
        }
    };



    const fetchAvailableRooms = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/admin-api/rooms`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Filter rooms that have space
            const rooms = response.data.filter(room => room.occupants.length < room.capacity);
            setAvailableRooms(rooms);
        } catch (err) {
            console.error('Failed to fetch available rooms', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setFormLoading(true);

        try {
            await axios.post('process.env.SERVER_URL/admin-api/student-register',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setFormSuccess('Student registered successfully!');
            setFormData({
                name: '',
                rollNumber: '',
                branch: '',
                year: '',
                phoneNumber: '',
                email: '',
                parentMobileNumber: '',
                roomNumber: '',
                password: ''
            });
            fetchStudents();
            setTimeout(() => {
                setShowForm(false);
                setFormSuccess('');
            }, 2000);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to register student');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.branch && student.branch.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.roomNumber && student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.phoneNumber && student.phoneNumber.includes(searchTerm))
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Students Management</h2>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : 'Register New Student'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="card mb-4">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Register New Student</h5>
                    </div>
                    <div className="card-body">
                        {formError && (
                            <div className="alert alert-danger" role="alert">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="alert alert-success" role="alert">
                                {formSuccess}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="name" className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="rollNumber" className="form-label">Roll Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="rollNumber"
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="branch" className="form-label">Branch</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="branch"
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label htmlFor="year" className="form-label">Year</label>
                                    <select
                                        className="form-select"
                                        id="year"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label htmlFor="parentMobileNumber" className="form-label">Parent's Phone</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="parentMobileNumber"
                                        name="parentMobileNumber"
                                        value={formData.parentMobileNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label htmlFor="roomNumber" className="form-label">Room Number (Optional)</label>
                                    <select
                                        className="form-select"
                                        id="roomNumber"
                                        name="roomNumber"
                                        value={formData.roomNumber}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Auto-allocate</option>
                                        {availableRooms.map(room => (
                                            <option key={room._id} value={room.roomNumber}>
                                                Room {room.roomNumber} ({room.occupants.length}/{room.capacity} occupied)
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-text text-muted">Leave empty for auto-allocation</small>
                                </div>
                                <div className="col-md-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={formLoading}
                                    >
                                        {formLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Registering...
                                            </>
                                        ) : 'Register Student'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header bg-light">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                Active Students
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                                onClick={() => setActiveTab('inactive')}
                            >
                                Inactive Students
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, roll number, email, branch, room number, or phone number..."
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
                    ) : filteredStudents.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                            No students found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Roll Number</th>
                                        <th>Branch</th>
                                        <th>Year</th>
                                        <th>Room</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student._id}>
                                            <td>{student.name}</td>
                                            <td>{student.rollNumber}</td>
                                            <td>{student.branch}</td>
                                            <td>{student.year}</td>
                                            <td>{student.roomNumber}</td>
                                            <td>{student.email}</td>
                                            <td>{student.phoneNumber}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => {
                                                            setSelectedRollNumber(student.rollNumber);
                                                            setShowDetailsModal(true);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                    {activeTab === 'active' && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeactivateStudent(student.rollNumber)}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
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

            {/* Student Details Modal */}
            <StudentDetailsModal
                show={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                rollNumber={selectedRollNumber}
                onStudentUpdated={() => fetchStudents()}
            />
        </div>
    );
};

export default Students;
