const exp = require('express');
const app = exp();
const http = require('http');
const server = http.createServer(app);
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/MessageModel');
const passport = require('passport');
const session = require('express-session');
require('./config/passport');

const authRoutes = require('./routes/authRoutes');

const adminApp = require('./APIs/adminAPI');
const studentApp = require('./APIs/studentAPI');
const messageApp = require('./APIs/messageAPI');
const foodApp = require('./APIs/foodAPI');
// const complaintApp = require('./APIs/complaintAPI');

// middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));

// body parser middleware
app.use(exp.json());

// Serve static files from uploads directory
app.use('/uploads', exp.static('uploads'));

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


// Api connection - Define routes before Socket.IO initialization
app.use('/student-api', studentApp);
app.use('/admin-api', adminApp);
app.use('/message-api', messageApp);
app.use('/food-api', foodApp);
// app.use('/complaint-api',complaintApp);
app.use('/auth', authRoutes);

const port = process.env.PORT || 4000;

// Initialize Socket.IO after routes are defined
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"]
    }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Log all connected clients
    const connectedClients = io.sockets.adapter.rooms.get('community')?.size || 0;
    console.log(`Total connected clients in community room: ${connectedClients}`);

    // Join community room
    socket.join('community');
    console.log(`Socket ${socket.id} joined community room`);

    // Handle new message
    socket.on('sendMessage', async (messageData) => {
        try {
            console.log(`Received message from ${socket.id}:`, messageData);

            // Create new message in database
            const newMessage = new Message(messageData);
            await newMessage.save();
            console.log(`Message saved to database with ID: ${newMessage._id}`);

            // Broadcast message to all clients in the room
            io.to('community').emit('newMessage', newMessage);
            console.log(`Message broadcasted to community room`);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle image upload in message
    socket.on('sendImageMessage', async (messageData) => {
        try {
            console.log(`Received image message from ${socket.id}`);

            // Create new message with image in database
            const newMessage = new Message(messageData);
            await newMessage.save();
            console.log(`Image message saved to database with ID: ${newMessage._id}`);

            // Broadcast message to all clients in the room
            io.to('community').emit('newMessage', newMessage);
            console.log(`Image message broadcasted to community room`);
        } catch (error) {
            console.error('Error saving image message:', error);
        }
    });

    // Log all events for debugging
    socket.onAny((event, ...args) => {
        console.log(`Socket ${socket.id} event: ${event}`, args);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
        const remainingClients = io.sockets.adapter.rooms.get('community')?.size || 0;
        console.log(`Remaining clients in community room: ${remainingClients}`);
    });
});

// DB connection
console.log("Attempting to connect to MongoDB...");

// Start the server without waiting for MongoDB connection
server.listen(port, () => {
    console.log(`Server listening on port ${port}...`);

    // Try to connect to MongoDB after server is started
    mongoose.connect(process.env.DBURL)
    .then(() => {
        console.log("MongoDB connection successful!");
    })
    .catch(err => {
        console.error("Error in DB connection:", err);
        console.log("Server will continue running, but database features will not work.");
    });
});



// app.use('/uploads', express.static('uploads'));
// app.use('/api/admin', adminRoutes);
// app.use('/api/student', studentRoutes);
// app.use('/api/complaints', complaintRoutes);


// error handler
app.use((err,req,res,next)=>{
    console.log("err object in express error handler :",err)
    res.send({message:err.message})
})
