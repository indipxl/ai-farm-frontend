import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from 'react'
import './App.css'
import LandingPage from "./LandingPage";
import LoginPage from "./Login";
import FarmSenseApp from './FarmSenseApp';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<FarmSenseApp />} />
      </Routes>
    </BrowserRouter>
    {/* <FarmSenseApp /> */}
    </>
  )
}

export default App
