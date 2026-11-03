import React from 'react';
import { 
  FolderKanban, 
  SlidersHorizontal, 
  User
} from 'lucide-react';
import { AuthUser } from '../types/project';
import { APP_CONFIG } from '../config/appConfig';

interface NavbarProps {
  onOpenFilterAnalytics: () => void;
  activeWorksheet: string;
  authUser: AuthUser | null;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFilterAnalytics,
  activeWorksheet,
  authUser,
  onOpenProfile
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo (Clean, sleek, without cluttered tags or subtitles) */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <FolderKanban className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
              {APP_CONFIG.name}
            </span>
          </div>
        </div>

        {/* Action Controls (Clean and focused: Filter & Profile only) */}
        <div className="flex items-center space-x-2.5">
          
          {/* Filter & Analytics Button */}
          <button
            onClick={onOpenFilterAnalytics}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer shadow-xs"
            title="Worksheets, Date Ranges & Analytics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filter & Analytics</span>
            {activeWorksheet && activeWorksheet !== 'All Worksheets' && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                {activeWorksheet.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Profile Avatar / Settings Button */}
          {authUser && (
            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition cursor-pointer"
              title="Open Profile & Settings"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate hidden sm:inline">
                {authUser.name || authUser.email}
              </span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
