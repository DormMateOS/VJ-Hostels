import React from 'react';
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from '../context/SecurityContext';
import SecurityLayout from '../layouts/SecurityLayout'
import VisitorManagement from '../components/security/VisitorManagement';
import Home from '../components/student/HomePage'
import Attendance from '../components/security/Attendance';

function SecurityPage() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<SecurityLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="visitors" element={<VisitorManagement />} />
          <Route path="attendance" element={<Attendance/>}></Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default SecurityPage;

