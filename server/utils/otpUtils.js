const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class OTPUtils {
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  static async hashOTP(otp, phone) {
    try {
      const sanitizedPhone = this.sanitizePhoneNumber(phone);
      const combined = `${otp}:${sanitizedPhone}`;
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(combined, salt);
    } catch (error) {
      console.error('OTP hash error:', error);
      throw error;
    }
  }

  static async verifyOTP(providedOtp, phone, otpHash) {
    try {
      const sanitizedPhone = this.sanitizePhoneNumber(phone);
      const combined = `${providedOtp}:${sanitizedPhone}`;
      return bcrypt.compare(combined, otpHash);
    } catch (error) {
      console.error('OTP verify error:', error);
      return false;
    }
  }

  static isOTPExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }

  static isOutOfHours() {
    const now = new Date();
    const hour = now.getHours();
    
    // Consider 10 PM to 6 AM as out of hours
    return hour >= 22 || hour < 6;
  }

  static generateExpiryTime(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static sanitizePhoneNumber(phone) {
    if (!phone) return '';
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  static validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static maskPhoneNumber(phone) {
    if (!phone || phone.length < 4) return phone;
    
    const visible = phone.slice(-4);
    const masked = '*'.repeat(phone.length - 4);
    return masked + visible;
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = OTPUtils;
