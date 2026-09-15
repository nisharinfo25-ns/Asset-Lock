import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadAssetPage } from './pages/UploadAssetPage';
import { MyAssetsPage } from './pages/MyAssetsPage';
import { AssetDetailsPage } from './pages/AssetDetailsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { IntegrityPage } from './pages/IntegrityPage';
import { AuditPage } from './pages/AuditPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Application Routes (Protected with Layout) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
              <Layout>
                <UploadAssetPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <Layout>
                <MyAssetsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AssetDetailsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/:id/permissions"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
              <Layout>
                <PermissionsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/integrity"
          element={
            <ProtectedRoute>
              <Layout>
                <IntegrityPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
