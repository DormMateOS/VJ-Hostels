// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep error logs for debugging
};
