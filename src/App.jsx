import { createElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/public/login";
import Register from "./pages/public/Register";
import {
  AdminChallenges,
  AdminDashboard,
  AdminLessons,
  AdminQuizzes,
  AdminSubmissions,
  AdminUsers,
} from "./pages/admin/AdminPages";
import {
  AdminLeaderboard,
  StudentChallengeDetail,
  StudentChallenges,
  StudentDashboard,
  StudentLeaderboard,
  StudentLessonDetail,
  StudentLessons,
  StudentNotifications,
  StudentProfile,
  StudentQuizAttempt,
  StudentQuizzes,
  StudentSubmissions,
} from "./pages/student/StudentPages";

function Guard({ role, children }) {
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  const currentRole = localStorage.getItem("role");
  if (currentRole !== "student" && currentRole !== "admin") return <Navigate to="/login" replace />;
  if (currentRole !== role) {
    return <Navigate to={currentRole === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }
  return children;
}

function Protected({ role, element }) {
  const location = useLocation();
  return createElement(Guard, {
    role,
    children: createElement(element, { key: location.pathname }),
  });
}

function HomeRedirect() {
  if (!localStorage.getItem("token")) return <Navigate to="/" replace />;
  const role = localStorage.getItem("role");
  if (role !== "student" && role !== "admin") return <Navigate to="/login" replace />;
  return <Navigate to={role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
}

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<HomeRedirect />} />

        <Route path="/student/dashboard" element={<Protected role="student" element={StudentDashboard} />} />
        <Route path="/student/lessons" element={<Protected role="student" element={StudentLessons} />} />
        <Route path="/student/lessons/:id" element={<Protected role="student" element={StudentLessonDetail} />} />
        <Route path="/student/quizzes" element={<Protected role="student" element={StudentQuizzes} />} />
        <Route path="/student/quizzes/:id" element={<Protected role="student" element={StudentQuizAttempt} />} />
        <Route path="/student/challenges" element={<Protected role="student" element={StudentChallenges} />} />
        <Route path="/student/challenges/:id" element={<Protected role="student" element={StudentChallengeDetail} />} />
        <Route path="/student/submissions" element={<Protected role="student" element={StudentSubmissions} />} />
        <Route path="/student/leaderboard" element={<Protected role="student" element={StudentLeaderboard} />} />
        <Route path="/student/profile" element={<Protected role="student" element={StudentProfile} />} />
        <Route path="/student/notifications" element={<Protected role="student" element={StudentNotifications} />} />

        <Route path="/admin/dashboard" element={<Protected role="admin" element={AdminDashboard} />} />
        <Route path="/admin/lessons" element={<Protected role="admin" element={AdminLessons} />} />
        <Route path="/admin/quizzes" element={<Protected role="admin" element={AdminQuizzes} />} />
        <Route path="/admin/challenges" element={<Protected role="admin" element={AdminChallenges} />} />
        <Route path="/admin/submissions" element={<Protected role="admin" element={AdminSubmissions} />} />
        <Route path="/admin/users" element={<Protected role="admin" element={AdminUsers} />} />
        <Route path="/admin/leaderboard" element={<Protected role="admin" element={AdminLeaderboard} />} />
        <Route path="/adminDashboard" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </>
  );
}

export default App;
