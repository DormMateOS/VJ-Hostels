import React from 'react';
import { motion } from 'framer-motion';
import StudentLayout from '../components/layouts/StudentLayout';

const StudentPage = () => {
  return (
    <StudentLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Student Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Access your hostel services, food menu, and more
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Food Menu Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Menu</h3>
              <p className="text-gray-600 text-sm mb-4">
                View daily menu and food preferences
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm">
                View Menu
              </button>
            </div>
          </motion.div>

          {/* Outpass Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🚪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Outpass</h3>
              <p className="text-gray-600 text-sm mb-4">
                Apply for outpass and check status
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                Apply Outpass
              </button>
            </div>
          </motion.div>

          {/* Complaints Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complaints</h3>
              <p className="text-gray-600 text-sm mb-4">
                Submit and track your complaints
              </p>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm">
                File Complaint
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentPage;
