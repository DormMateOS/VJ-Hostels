const exp = require('express');
const securityRouter = exp.Router();
const Guard = require('../models/GuardModel');
const expressAsyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Security/Guard login
securityRouter.post('/login', expressAsyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Find guard by username
        const guard = await Guard.findOne({ username });
        if (!guard) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, guard.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if guard is active
        if (!guard.isActive) {
            return res.status(403).json({ message: "Your account is inactive. Please contact admin." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: guard._id, 
                role: 'security', 
                username: guard.username,
                name: guard.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Return guard data and token
        res.status(200).json({
            message: "Login successful",
            token,
            guard: {
                id: guard._id,
                username: guard.username,
                name: guard.name,
                email: guard.email,
                role: 'security',
                shift: guard.shift,
                phoneNumber: guard.phoneNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get guard profile
securityRouter.get('/profile', expressAsyncHandler(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'security') {
            return res.status(403).json({ message: "Access denied" });
        }

        const guard = await Guard.findById(decoded.id).select('-password');
        if (!guard) {
            return res.status(404).json({ message: "Guard not found" });
        }

        res.status(200).json(guard);
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
}));

// Admin creates a new guard account
securityRouter.post('/create-guard', expressAsyncHandler(async (req, res) => {
    try {
        const { username, password, name, email, phoneNumber, shift } = req.body;

        // Check if guard already exists
        const existingGuard = await Guard.findOne({ $or: [{ username }, { email }] });
        if (existingGuard) {
            return res.status(400).json({ message: "Guard with this username or email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new guard
        const newGuard = new Guard({
            username,
            password: hashedPassword,
            name,
            email,
            phoneNumber,
            shift: shift || 'day',
            isActive: true
        });

        await newGuard.save();
        res.status(201).json({ message: "Guard account created successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

module.exports = securityRouter;
