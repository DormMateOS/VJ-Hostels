import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
// UserContext removed - now using useCurrentUser hook

import RootLayout from './layouts/RootLayout.jsx';
import Home from './pages/Home.jsx';
import StudentLogin from './components/StudentLogin.jsx';
import Announcement from './components/Announcement.jsx';
import Community from './components/Community.jsx';
import Complaints from './components/Complaints.jsx';
import Outpass from './components/Outpass.jsx';
import StudentProfile from './components/StudentProfile.jsx';
import TodayAnnouncements from './components/TodayAnnouncements.jsx';
import AllAnnouncements from './components/AllAnnouncements.jsx';
import OutpassPage from './components/OutpassPage.jsx';
import OutpassList from './components/OutpassList.jsx';
import PostComplaint from './components/PostComplaints.jsx';
import ComplaintsList from './components/ComplaintsList.jsx';
import Food from './components/Food.jsx';
import VisitorManagement from './components/VisitorManagement.jsx';
import AuthHandler from './components/AuthHandler.jsx';

const browserRouterObj = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <StudentLogin />,
  },
  {
    path: '/auth/callback',
    element: <AuthHandler />,
  },
  {
    path: '/home',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'announcements',
        element: <Announcement />,
        children: [
          { path: 'today', element: <TodayAnnouncements /> },
          { path: 'all', element: <AllAnnouncements /> }
        ]
      },
      {
        path: 'community',
        element: <Community />
      },
      {
        path: 'complaints',
        element: <Complaints />,
        children: [
          { path: 'complaint', element: <PostComplaint/> },
          { path: 'complaint-list', element: <ComplaintsList /> }
        ]
      },
      {
        path: 'outpass',
        element: <OutpassPage />,
        children: [
          { path: 'apply-outpass', element: <Outpass/> },
          { path: 'outpass-history', element: <OutpassList/> }
        ]
      },
      {
        path: 'profile',
        element: <StudentProfile />
      },
      {
        path: 'food',
        element: <Food />
      },
      {
        path: 'visitors',
        element: <VisitorManagement />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={browserRouterObj} />
  </StrictMode>,
);

