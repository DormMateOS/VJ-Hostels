import { Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from '../layouts/StudentLayout';
import Home from '../components/student/HomePage';
import Announcement from '../components/student/Announcement';
import TodayAnnouncements from '../components/student/TodayAnnouncements';
import AllAnnouncements from '../components/student/AllAnnouncements';
import Community from '../components/student/Community';
import Complaints from '../components/student/Complaints';
import PostComplaint from '../components/student/PostComplaints';
import ComplaintsList from '../components/student/ComplaintsList';
import OutpassPage from '../components/student/OutpassPage';
import Outpass from '../components/student/Outpass';
import OutpassList from '../components/student/OutpassList';
import StudentProfile from '../components/student/StudentProfile';
import Food from '../components/student/Food';
import VisitorManagement from '../components/student/VisitorManagement';

function StudentPage() {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/announcements" element={<Announcement />} />
        <Route path="/announcements/today" element={<TodayAnnouncements />} />
        <Route path="/announcements/all" element={<AllAnnouncements />} />
        <Route path="/community" element={<Community />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/complaints/complaint" element={<PostComplaint />} />
        <Route path="/complaints/complaint-list" element={<ComplaintsList />} />
        <Route path="/outpass" element={<OutpassPage />} />
        <Route path="/outpass/apply-outpass" element={<Outpass />} />
        <Route path="/outpass/outpass-history" element={<OutpassList />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/food" element={<Food />} />
        <Route path="/visitors" element={<VisitorManagement />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </StudentLayout>
  );
}

export default StudentPage;
