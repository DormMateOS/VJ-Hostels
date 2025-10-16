import React, { useState, useEffect, useRef } from 'react';
// import { useUser } from '../context/UserContext';
import axios from 'axios';
import { io } from 'socket.io-client';

const Chat = () => {
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageCaption, setImageCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const messagesEndRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        console.log('Attempting to connect to socket server...');

        try {
            // Create a real socket.io connection
            const newSocket = io(`${import.meta.env.VITE_SERVER_URL}`);

            // Set up event handlers
            newSocket.on('connect', () => {
                console.log('Socket connected successfully!', newSocket.id);
                setConnectionStatus('connected');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setConnectionStatus('error');
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setConnectionStatus('disconnected');
            });

            setSocket(newSocket);

            // Clean up on unmount
            return () => {
                console.log('Cleaning up socket connection...');
                newSocket.disconnect();
            };
        } catch (error) {
            console.error('Error initializing socket:', error);
            setConnectionStatus('error');
        }
    }, []);

    // Load initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                console.log('Fetching messages from server...');
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/message-api/all`);

                if (response.data && Array.isArray(response.data)) {
                    setMessages(response.data);
                    console.log(`Fetched ${response.data.length} messages from server`);
                } else {
                    console.warn('Unexpected response format:', response.data);
                    setMessages([]);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
                // If we can't fetch messages, start with an empty array
                setMessages([]);
            }
        };

        fetchMessages();
    }, []);

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
            setImageCaption(''); // Reset caption when new image is selected

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

        console.log('Uploading image to server...');

        try {
            const formData = new FormData();
            formData.append('messageImage', selectedImage);

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/message-api/upload-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Image uploaded successfully:', response.data);
            return response.data.imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();

        // Check if we have either text message or image (with optional caption)
        if ((!newMessage.trim() && !selectedImage) || loading) return;

        setLoading(true);

        try {
            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                imageUrl = await uploadImage();
            }

            // Determine content based on what's available
            let content = newMessage.trim();

            // If there's an image caption and no regular message, use the caption as content
            if (selectedImage && imageCaption.trim() && !content) {
                content = imageCaption.trim();
            }
            // If there's both a regular message and an image caption, combine them
            else if (selectedImage && imageCaption.trim() && content) {
                content = `${content}\n\nImage caption: ${imageCaption.trim()}`;
            }

            // Create message data
            const messageData = {
                content: content,
                sender: user.id || user.rollNumber,
                senderModel: 'Student',
                senderName: user.name,
                senderRollNumber: user.rollNumber,
                senderProfilePhoto: user.profilePhoto,
                isAdmin: false,
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
            setImageCaption('');
            setShowEmojiPicker(false);
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
        setImageCaption('');
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Community Chat</h5>
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${
                            connectionStatus === 'connected' ? 'bg-success' :
                            connectionStatus === 'error' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                            {connectionStatus === 'connected' ? 'Connected' :
                             connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                        </span>
                        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
                            <button
                                onClick={() => {
                                    console.log('Manually reconnecting...');

                                    // Disconnect existing socket if any
                                    if (socket) {
                                        socket.disconnect();
                                    }

                                    // Create a new socket connection
                                    try {
                                        const newSocket = io(`${import.meta.env.VITE_SERVER_URL}`);

                                        // Set up event handlers
                                        newSocket.on('connect', () => {
                                            console.log('Socket reconnected successfully!', newSocket.id);
                                            setConnectionStatus('connected');
                                        });

                                        newSocket.on('connect_error', (error) => {
                                            console.error('Socket reconnection error:', error);
                                            setConnectionStatus('error');
                                        });

                                        newSocket.on('disconnect', (reason) => {
                                            console.log('Socket disconnected:', reason);
                                            setConnectionStatus('disconnected');
                                        });

                                        // Listen for new messages
                                        newSocket.on('newMessage', (message) => {
                                            setMessages((prevMessages) => [...prevMessages, message]);
                                        });

                                        setSocket(newSocket);

                                        // Fetch messages after reconnecting
                                        const fetchMessages = async () => {
                                            try {
                                                console.log('Fetching messages after reconnection...');
                                                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/message-api/all`);

                                                if (response.data && Array.isArray(response.data)) {
                                                    setMessages(response.data);
                                                    console.log(`Fetched ${response.data.length} messages after reconnection`);
                                                }
                                            } catch (error) {
                                                console.error('Error fetching messages after reconnection:', error);
                                            }
                                        };

                                        fetchMessages();
                                    } catch (error) {
                                        console.error('Error reconnecting socket:', error);
                                        setConnectionStatus('error');
                                    }
                                }}
                                className="btn btn-sm btn-primary"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages container */}
            <div className="chat-messages">
                {connectionStatus === 'error' ? (
                    <div className="alert alert-danger text-center">
                        <p className="mb-0">Unable to connect to the chat server. Please check if the server is running and try again.</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted my-4">
                        <p className="mb-0">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message._id || index}
                            className={`chat-message ${
                                message.senderRollNumber === user.rollNumber ? 'own' :
                                message.isAdmin ? 'admin' : 'other'
                            }`}
                        >
                            <div className="chat-message-header">
                                <div className="chat-avatar">
                                    {message.senderProfilePhoto ? (
                                        <img
                                            src={message.senderProfilePhoto}
                                            alt={message.senderName}
                                            className="w-100 h-100 rounded-circle"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        message.senderName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="chat-sender-name">
                                    {message.senderName}
                                    {message.isAdmin && (
                                        <span className="badge bg-primary ms-1" style={{ fontSize: '0.6rem' }}>Admin</span>
                                    )}
                                </div>
                                <div className="chat-timestamp">
                                    {new Date(message.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="mt-2">
                                {message.content && (
                                    <div className="mb-2">
                                        {message.content.split('\n').map((text, i) => (
                                            <React.Fragment key={i}>
                                                {text}
                                                {i < message.content.split('\n').length - 1 && <br />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {message.image && (
                                    <div className="mt-2">
                                        <img
                                            src={message.image}
                                            alt="Message attachment"
                                            className="img-fluid rounded"
                                            style={{
                                                maxHeight: '200px',
                                                cursor: 'pointer',
                                                objectFit: 'cover'
                                            }}
                                            onClick={() => window.open(message.image, '_blank')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input form */}
            <div className="chat-input-container">
                {imagePreview && (
                    <div className="mb-3 position-relative p-2 bg-light rounded">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-thumbnail"
                            style={{ maxHeight: '120px' }}
                        />
                        <button
                            type="button"
                            onClick={cancelImage}
                            className="btn btn-sm btn-danger position-absolute top-0 end-0"
                            style={{ transform: 'translate(50%, -50%)' }}
                        >
                            ×
                        </button>

                        {/* Image caption input */}
                        <input
                            type="text"
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            placeholder="Add a caption to this image..."
                            className="form-control form-control-sm mt-2"
                            disabled={loading || connectionStatus !== 'connected'}
                        />
                    </div>
                )}

                <form onSubmit={sendMessage}>
                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={connectionStatus !== 'connected' ? "Chat unavailable - Server connection issue" : "Type a message..."}
                            className="chat-input"
                            disabled={loading || connectionStatus !== 'connected'}
                        />

                        <label
                            htmlFor="image-upload"
                            className="btn btn-outline-secondary btn-sm"
                            title="Attach image"
                            style={{
                                opacity: connectionStatus !== 'connected' ? 0.5 : 1,
                                pointerEvents: connectionStatus !== 'connected' ? 'none' : 'auto'
                            }}
                        >
                            📎
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                            disabled={loading || connectionStatus !== 'connected'}
                        />

                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={(!newMessage.trim() && !selectedImage) || loading || connectionStatus !== 'connected'}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Styles are now handled by CSS classes in custom.css

export default Chat;
