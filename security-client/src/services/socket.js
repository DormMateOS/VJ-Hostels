import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupEventListeners() {
    // OTP Events
    this.socket.on('otpVerified', (data) => {
      this.emit('otpVerified', data);
    });

    this.socket.on('visitCreated', (data) => {
      this.emit('visitCreated', data);
    });

    this.socket.on('visitCheckedOut', (data) => {
      this.emit('visitCheckedOut', data);
    });

    // Override Events
    this.socket.on('overrideRequested', (data) => {
      this.emit('overrideRequested', data);
    });

    this.socket.on('overrideProcessed', (data) => {
      this.emit('overrideProcessed', data);
    });
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Join specific rooms if needed
  joinRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('join', room);
    }
  }

  leaveRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('leave', room);
    }
  }
}

export default new SocketService();
