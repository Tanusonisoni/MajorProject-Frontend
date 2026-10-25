import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/public/login";
import Register from "./pages/public/Register";
import AdmisDashboard from "./pages/admin/AdmisDashboard";
import SideBar from "../src/pages/admin/SideBar";
import LessonUpload from "../src/pages/admin/LessonUpload"

function App() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
      />

      {/* <Routes>
        <Route
          path="/"
          element={
            <LandingPage onComplete={() => setIntroComplete(true)} />
          }
        />

        <Route
          path="/login"
          element={
            introComplete ? <Login /> : <Navigate to="/" replace />
          }
        />

        <Route path="/register" element={<Register />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes> */}
      {/* <SideBar/> */}
      {/* <AdmisDashboard/> */}
      <LessonUpload/>
    </>
  );
}

export default App;