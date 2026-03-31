import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css'
import LandingPage from "./LandingPage";
import LoginPage from "./Login";
import FarmSenseApp from './FarmSenseApp';
import ProtectedRoute from './ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <FarmSenseApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
