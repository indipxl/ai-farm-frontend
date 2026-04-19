import { Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/Dashboard.jsx";
import SoilHealth from "./pages/SoilHealth.jsx";
import DiseaseMap from "./pages/DiseaseMap.jsx";
import CropProfiles from "./pages/CropProfiles.jsx";
import BatchProfiles from "./pages/BatchProfiles.jsx";
import Sidebar from "./components/Sidebar.jsx";
import "./farmsense.css";

import FarmLayout from "./pages/FarmLayout.jsx";

export default function FarmSenseApp() {
  return (
    <div className="fs-app">
      <Sidebar />

      <div className="fs-content">
        <div className="fs-page">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/disease-map" element={<DiseaseMap />} />
            <Route path="/crop-profiles" element={<CropProfiles />} />
            <Route path="/batch-profiles" element={<BatchProfiles />} />
            <Route path="/farm-layout" element={<FarmLayout />} />
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
