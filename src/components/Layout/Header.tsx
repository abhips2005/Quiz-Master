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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">QuizMaster</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userProfile && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    {userProfile.total_points || 0} pts
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-orange-700">
                    🔥 {userProfile.streak || 0}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {userProfile?.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Student'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};