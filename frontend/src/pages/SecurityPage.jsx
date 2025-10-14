import React from 'react';
import { motion } from 'framer-motion';
import SecurityLayout from '../components/layouts/SecurityLayout';

const SecurityPage = () => {
  return (
    <SecurityLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Security Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Monitor hostel security, visitor management, and OTP verification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Visitor Management */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visitors</h3>
              <p className="text-gray-600 text-sm mb-4">
                Register and manage visitors
              </p>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm">
                Manage
              </button>
            </div>
          </motion.div>

          {/* OTP Verification */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">OTP System</h3>
              <p className="text-gray-600 text-sm mb-4">
                Verify student OTPs
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm">
                Verify OTP
              </button>
            </div>
          </motion.div>

          {/* Emergency Alerts */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alerts</h3>
              <p className="text-gray-600 text-sm mb-4">
                Emergency notifications
              </p>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm">
                View Alerts
              </button>
            </div>
          </motion.div>

          {/* Guard Schedule */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm mb-4">
                View duty schedule
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                View Schedule
              </button>
            </div>
          </motion.div>

          {/* Incident Reports */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
              <p className="text-gray-600 text-sm mb-4">
                File incident reports
              </p>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm">
                Create Report
              </button>
            </div>
          </motion.div>

          {/* Access Control */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access</h3>
              <p className="text-gray-600 text-sm mb-4">
                Control entry/exit
              </p>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">
                Manage
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </SecurityLayout>
  );
};

export default SecurityPage;
