import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAdmin } from '../../context/AdminContext'
import { io } from 'socket.io-client';

const AdminChat = () => {
    const { admin, token } = useAdmin();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_SERVER_URL}`);
        setSocket(newSocket);

        // Clean up on unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Load initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/message-api/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
    }, [token]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        socket.on('newMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('newMessage');
        };
    }, [socket]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle image upload
    const uploadImage = async () => {
        if (!selectedImage) return null;

        const formData = new FormData();
        formData.append('messageImage', selectedImage);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/message-api/upload-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return response.data.imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();

        if ((!newMessage.trim() && !selectedImage) || loading) return;

        setLoading(true);

        try {
            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                imageUrl = await uploadImage();
            }

            // Create message data
            const messageData = {
                content: newMessage.trim(),
                sender: admin.id || admin.username,
                senderModel: 'Admin',
                senderName: admin.name,
                senderRollNumber: null,
                senderProfilePhoto: null, // Admin profile photo could be added here
                isAdmin: true,
                image: imageUrl,
                room: 'community'
            };

            // Send message via socket
            if (socket) {
                socket.emit('sendMessage', messageData);
            }

            // Clear form
            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cancel image selection
    const cancelImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    return (
        <div className="card h-100">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Community Chat</h5>
            </div>

            <div className="card-body d-flex flex-column p-0">
                {/* Messages container */}
                <div className="flex-grow-1 p-3 overflow-auto" style={{ maxHeight: '500px' }}>
                    {messages.length === 0 ? (
                        <div className="text-center text-muted my-5">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={message._id || index}
                                className={`mb-3 ${message.isAdmin ? 'ms-auto' : ''}`}
                                style={{ maxWidth: '80%' }}
                            >
                                <div className={`card ${message.isAdmin ? 'bg-light border-primary' : 'bg-white'}`}>
                                    <div className="card-header d-flex align-items-center py-2">
                                        {message.senderProfilePhoto ? (
                                            <img
                                                src={message.senderProfilePhoto}
                                                alt={message.senderName}
                                                className="rounded-circle me-2"
                                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                className={`rounded-circle me-2 d-flex align-items-center justify-content-center ${message.isAdmin ? 'bg-primary' : 'bg-secondary'} text-white`}
                                                style={{ width: '32px', height: '32px' }}
                                            >
                                                {message.senderName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="d-flex align-items-center">
                                                <span className="fw-bold">{message.senderName}</span>
                                                {message.isAdmin && (
                                                    <span className="badge bg-primary ms-2">Admin</span>
                                                )}
                                                {message.senderRollNumber && (
                                                    <small className="text-muted ms-2">({message.senderRollNumber})</small>
                                                )}
                                            </div>
                                            <small className="text-muted">
                                                {new Date(message.createdAt).toLocaleString()}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="card-body py-2">
                                        {message.content && <p className="card-text mb-2">{message.content}</p>}

                                        {message.image && (
                                            <img
                                                src={message.image}
                                                alt="Message attachment"
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '200px', cursor: 'pointer' }}
                                                onClick={() => window.open(message.image, '_blank')}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message input form */}
                <div className="border-top p-3">
                    <form onSubmit={sendMessage}>
                        {imagePreview && (
                            <div className="position-relative d-inline-block mb-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="rounded border"
                                    style={{ maxHeight: '100px' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle"
                                    style={{ transform: 'translate(50%, -50%)' }}
                                    onClick={cancelImage}
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                disabled={loading}
                            />

                            <label htmlFor="admin-image-upload" className="input-group-text btn btn-outline-secondary">
                                <i className="bi bi-paperclip"></i>
                            </label>
                            <input
                                id="admin-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="d-none"
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={(!newMessage.trim() && !selectedImage) || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>Send <i className="bi bi-send ms-1"></i></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
