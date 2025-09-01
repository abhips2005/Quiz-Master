import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Target, Users, Award, Clock, Star } from 'lucide-react';
import { CumulativeLeaderboard } from './CumulativeLeaderboard';
import { getUserCumulativeStats } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface UserStats {
  total_score: number;
  sessions_participated: number;
  best_session_score: number;
  average_session_score: number;
}

export const CompetitionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user stats if logged in
        if (user) {
          const { data: stats } = await getUserCumulativeStats(user.id);
          setUserStats(stats);
        }
      } catch (err) {
        console.error('Error fetching competition data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
          Cumulative Leaderboard
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">
          Track your progress across all quiz sessions
        </p>
      </div>

      {/* User Stats Overview */}
      {user && userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Score */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userStats.total_score}</h3>
            <p className="text-sm text-gray-600">Total Score</p>
          </div>

          {/* Sessions Participated */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userStats.sessions_participated}</h3>
            <p className="text-sm text-gray-600">Sessions Participated</p>
          </div>

          {/* Best Session Score */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userStats.best_session_score}</h3>
            <p className="text-sm text-gray-600">Best Session Score</p>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl p-4 card-shadow text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userStats.average_session_score.toFixed(1)}</h3>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-3">
            <Award className="h-4 w-4 mr-2" />
            How It Works
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple Cumulative Scoring</h2>
          <p className="text-gray-600 mb-4">
            Every time you participate in a quiz session, your score is automatically added to your total.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              All Sessions Count
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Real-time Updates
            </span>
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              No Time Limits
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <CumulativeLeaderboard 
        title="Overall Standings"
        maxEntries={25}
      />
    </div>
  );
};
