import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PatientAssistancePage } from './pages/PatientAssistancePage';
import { NurseDashboardPage } from './pages/NurseDashboardPage';
import { QrDirectoryPage } from './pages/QrDirectoryPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* 
        Route-based isolation:
        - /bed/:qrToken: Fully decoupled patient mobile view (no nurse controls or headers)
        - /nurse/dashboard: Fully decoupled nurse station monitoring view
        - /qr-directory & /: Testing bed directory & QR simulation
      */}
      <Routes>
        {/* Isolated Patient Mobile Web Interface */}
        <Route path="/bed/:qrToken" element={<PatientAssistancePage />} />

        {/* Isolated Nurse Station Dashboard */}
        <Route path="/nurse/dashboard" element={<NurseDashboardPage />} />

        {/* Hospital Bed QR Placard Directory & Testing */}
        <Route path="/qr-directory" element={<QrDirectoryPage />} />
        <Route path="/" element={<QrDirectoryPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
