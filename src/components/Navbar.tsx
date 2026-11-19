import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Navigation2, PhoneCall, Radio, Activity } from 'lucide-react';

interface NavbarProps {
  wsConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ wsConnected = false }) => {
  return (
    <header className="sticky top-3 z-50 px-4 max-w-7xl mx-auto w-full pointer-events-auto">
      <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & System Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-red-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                Thefirstresponse360
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                Golden Hour
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Tamil Nadu Emergency Response & Coordination</p>
          </div>
        </div>

        {/* Floating Pill Role Switcher */}
        <nav className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <ShieldAlert className="w-4 h-4 text-blue-300" />
            <span>User Portal (Demo)</span>
          </NavLink>

          <NavLink
            to="/driver"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Navigation2 className="w-4 h-4 text-emerald-300" />
            <span>Ambulance Driver Portal</span>
          </NavLink>
        </nav>

        {/* Live Network & Quick Dial 108 */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-700/60 text-xs">
            <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={wsConnected ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {wsConnected ? 'Live Dispatch Sync' : 'Offline / Standalone'}
            </span>
          </div>

          <a
            href="tel:108"
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-transform active:scale-95 border border-red-400/40"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>DIAL 108</span>
          </a>
        </div>
      </div>
    </header>
  );
};
