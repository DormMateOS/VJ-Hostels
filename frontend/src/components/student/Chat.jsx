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

};

// Styles are now handled by CSS classes in custom.css

export default Chat;
