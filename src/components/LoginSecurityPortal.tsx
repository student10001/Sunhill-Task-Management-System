import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Users,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { SunhillLogo } from './SunhillLogo';

export const LoginSecurityPortal: React.FC = () => {
  const { users, login, appBackground, securityLogoUrl } = useAuth();

  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('admin');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBgImage = Boolean(appBackground?.imageUrl);

  const backgroundStyle: React.CSSProperties = hasBgImage
    ? {
        backgroundImage: `url("${appBackground.imageUrl}")`,
        backgroundSize: appBackground.mode === 'expand' ? 'cover' : 'auto',
        backgroundPosition: appBackground.mode === 'pattern' ? 'top left' : 'center center',
        backgroundRepeat: appBackground.mode === 'pattern' ? 'repeat' : 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: appBackground.opacity ?? 1
      }
    : {};

  // Filter users by mode if desired or show all with badge
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'manager');
  const memberUsers = users.filter((u) => u.role === 'member');
  
  const displayUsers = loginMode === 'admin' ? adminUsers : memberUsers;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedUserId) {
      setErrorMessage('Please select an account before authenticating.');
      return;
    }

    const result = login(selectedUserId, pinCode);
    if (!result.success) {
      setErrorMessage(result.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Dynamic Interface Background Layer */}
      {hasBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
          style={backgroundStyle}
        />
      )}

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2 flex flex-col items-center">
          {securityLogoUrl ? (
            <img
              src={securityLogoUrl}
              alt="Security Portal Logo"
              className="w-20 h-20 mb-1 object-contain filter drop-shadow-md rounded-2xl"
            />
          ) : (
            <SunhillLogo className="w-20 h-20 mb-1 filter drop-shadow-md" />
          )}
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sunhill Task Tracking System
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Role-Based Security Authentication Interface
          </p>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setSelectedUserId('');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                loginMode === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              <span>Admin Security Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('member');
                setSelectedUserId('');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                loginMode === 'member'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-950" />
              <span>Personnel Login</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Account Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold flex items-center justify-between">
                <span>Select Account ({loginMode === 'admin' ? 'Admin Personnel' : 'Team Personnel'})</span>
                <span className="text-[10px] text-slate-400">{displayUsers.length} Available</span>
              </label>

              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium appearance-none cursor-pointer pr-9"
                >
                  <option value="" disabled>
                    Select Account
                  </option>
                  {displayUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.role.toUpperCase()}) — {u.title || u.department || 'Personnel'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Selected User Quick Preview */}
              {selectedUserId && (() => {
                const selectedUser = displayUsers.find((u) => u.uid === selectedUserId);
                if (!selectedUser) return null;
                return (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center space-x-3 mt-2">
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span className="truncate">{selectedUser.displayName}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          {selectedUser.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">{selectedUser.title} • {selectedUser.department}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Security PIN Code Input */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold">
                Security PIN Passcode
              </label>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter security PIN..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        </div>

        {/* System Footer Badge */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Encrypted Firestore Security Governance • Role Protection Active</span>
        </div>
      </div>
    </div>
  );
};
