import { Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from '../layouts/StudentLayout';
import Home from '../components/student/HomePage';

function SecurityPage() {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </StudentLayout>
  );
}

export default SecurityPage;
