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

  static async hashOTP(otp, visitorPhone) {
    const secret = process.env.OTP_SECRET || 'default-otp-secret';
    const data = `${otp}:${visitorPhone}`;
    
    // Use HMAC-SHA256 for OTP hashing
    const hash = crypto.createHmac('sha256', secret)
                      .update(data)
                      .digest('hex');
    
    return hash;
  }

  static async verifyOTP(providedOTP, visitorPhone, storedHash) {
    const computedHash = await this.hashOTP(providedOTP, visitorPhone);
    return computedHash === storedHash;
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
    // Remove all non-digit characters and ensure it starts with country code
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, assume it's Indian and add +91
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    // If it already has country code, ensure it starts with +
    if (cleaned.length > 10 && !cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
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
