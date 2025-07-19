import React from 'react';
import { User, LogOut, Trophy, Zap } from 'lucide-react';
import { signOut } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  userProfile?: any;
}

export const Header: React.FC<HeaderProps> = ({ user, userProfile }) => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <div className="flex items-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-2xl font-bold text-gray-900 truncate">QuizMaster</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {userProfile && (
              <div className="hidden xs:flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center space-x-1 sm:space-x-2 bg-purple-50 px-2 sm:px-3 py-1 rounded-full">
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium text-purple-700">
                    {userProfile.total_points || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 bg-orange-50 px-2 sm:px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-medium text-orange-700">
                    🔥 {userProfile.streak || 0}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-24 sm:max-w-none">
                    {userProfile?.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Student'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};