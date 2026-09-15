import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'Owner' | 'Authorized User')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Verifying cryptographic session token...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-slate-900 border border-rose-500/40 rounded-xl text-center space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-100">Access Restricted by Role Policy</h2>
        <p className="text-xs text-slate-400">
          This operation requires role <span className="font-semibold text-rose-400">{allowedRoles.join(' or ')}</span>.
          Your current authenticated role is <span className="font-semibold text-emerald-400">{user.role}</span>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
