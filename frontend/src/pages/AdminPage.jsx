import React from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';

const AdminPage = () => {
  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Manage students, hostel operations, and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student Management */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage student records
              </p>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm">
                Manage
              </button>
            </div>
          </motion.div>

          {/* Food Management */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Menu</h3>
              <p className="text-gray-600 text-sm mb-4">
                Update daily menu
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm">
                Update
              </button>
            </div>
          </motion.div>

          {/* Outpass Management */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🚪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Outpass</h3>
              <p className="text-gray-600 text-sm mb-4">
                Review applications
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                Review
              </button>
            </div>
          </motion.div>

          {/* Reports */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
              <p className="text-gray-600 text-sm mb-4">
                View analytics
              </p>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm">
                View
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminPage;
