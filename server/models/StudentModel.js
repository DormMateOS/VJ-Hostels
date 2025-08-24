const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const studentSchema = new mongoose.Schema({
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true },
    rollNumber: {
        type: String,
        required: true,
        // unique: true
    },
    username: {
        type: String,
        // required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        // required: true
    },
    parentMobileNumber: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        required: function () {
    return !this.googleId;  // only required if no Google login
  }
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'student'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const StudentModel = mongoose.model('Student', studentSchema);

module.exports = StudentModel;
