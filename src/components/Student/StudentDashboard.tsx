import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Star, Clock, Award } from 'lucide-react';
import { JoinGame } from './JoinGame';
import { GamePlay } from './GamePlay';
import { getUserStats, getUserGameHistory, getUserBadges } from '../../lib/supabase';
import { GameSession } from '../../types';

interface StudentDashboardProps {
  userId: string;
}

interface GameHistory {
  score: number;
  join_time: string;
  game_sessions: {
    quiz_id: string;
    ended_at: string;
    quizzes: {
      title: string;
    }[];
  }[];
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ userId }) => {
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [userStats, setUserStats] = useState<{
    total_points: number;
    streak: number;
    level: number;
    name: string;
  } | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [userBadges, setUserBadges] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch user stats
      const { data: stats, error: statsError } = await getUserStats(userId);
      if (statsError) {
        console.error('Error loading user stats:', statsError);
      } else {
        setUserStats(stats);
      }

      // Fetch game history
      const { data: history, error: historyError } = await getUserGameHistory(userId, 5);
      if (historyError) {
        console.error('Error loading game history:', historyError);
      } else {
        setGameHistory(history || []);
      }

      // Fetch user badges
      const { data: badges, error: badgesError } = await getUserBadges(userId);
      if (badgesError) {
        console.error('Error loading user badges:', badgesError);
      } else {
        setUserBadges(badges || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleJoinGame = (gameSession: any) => {
    setCurrentGame(gameSession);
  };

  if (currentGame) {
    return (
      <GamePlay 
        session={currentGame} 
        onLeave={() => setCurrentGame(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h2>
        <p className="text-gray-600">Join live quizzes and compete with your classmates!</p>
      </div>

      {/* Join Game Section */}
      <div className="bg-white rounded-xl p-6 card-shadow mb-8">
        <JoinGame onJoinGame={handleJoinGame} userId={userId} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Points</p>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : (userStats?.total_points || 0)}
              </p>
            </div>
            <Trophy className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Games Played</p>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : (gameHistory?.length || 0)}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : (userStats?.streak || 0)}
              </p>
            </div>
            <Zap className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Level</p>
              <p className="text-2xl font-bold">
                {statsLoading ? '...' : (userStats?.level || 1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Games
          </h3>
          {statsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading recent games...</p>
            </div>
          ) : gameHistory.length > 0 ? (
            <div className="space-y-4">
              {gameHistory.map((game, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {game.game_sessions[0]?.quizzes[0]?.title || 'Quiz'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(game.join_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{game.score} pts</p>
                    <p className="text-sm text-gray-500">Score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No games played yet</p>
              <p className="text-sm text-gray-500 mt-1">Join your first quiz to see your activity here</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Achievements ({userBadges.length})
          </h3>
          {statsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading achievements...</p>
            </div>
          ) : userBadges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {userBadges.slice(0, 4).map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <span className="text-2xl">{achievement.badges.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{achievement.badges.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{achievement.badges.rarity}</p>
                  </div>
                </div>
              ))}
              {userBadges.length > 4 && (
                <div className="col-span-2 text-center p-2">
                  <p className="text-sm text-gray-500">+{userBadges.length - 4} more achievements</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No achievements yet</p>
              <p className="text-sm text-gray-500 mt-1">Earn badges by playing quizzes and achieving milestones</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-8 bg-white rounded-xl p-6 card-shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          Global Leaderboard
        </h3>
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Leaderboard coming soon</p>
          <p className="text-sm text-gray-500 mt-1">Compete with students from around the world</p>
        </div>
      </div>
    </div>
  );
};