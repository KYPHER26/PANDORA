import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import InstallPrompt from "./components/InstallPrompt";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import Gallery from "./pages/Gallery";
import CalendarPage from "./pages/CalendarPage";
import OurStory from "./pages/OurStory";
import SpecialMemories from "./pages/SpecialMemories";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import AddMemory from "./pages/AddMemory";
import MemoryDetail from "./pages/MemoryDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallPrompt />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/story" element={<OurStory />} />
            <Route path="/special" element={<SpecialMemories />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/memory/new" element={<AddMemory />} />
            <Route path="/memory/:id" element={<MemoryDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
