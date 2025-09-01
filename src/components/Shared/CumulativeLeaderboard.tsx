import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, TrendingUp, Target } from 'lucide-react';
import { getCumulativeLeaderboard } from '../../lib/supabase';

interface CumulativeLeaderboardEntry {
  user_id: string;
  user_name: string;
  total_score: number;
  sessions_participated: number;
  best_session_score: number;
  average_session_score: number;
  rank: number | bigint;
}



interface CumulativeLeaderboardProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  maxEntries?: number;
}

export const CumulativeLeaderboard: React.FC<CumulativeLeaderboardProps> = ({ 
  title = "Cumulative Leaderboard",
  showBackButton = false,
  onBack,
  maxEntries = 20
}) => {
  const [leaderboardData, setLeaderboardData] = useState<CumulativeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cumulative leaderboard
        const { data: leaderboard, error: leaderboardError } = await getCumulativeLeaderboard(maxEntries);
        if (leaderboardError) throw leaderboardError;
        
        setLeaderboardData(leaderboard || []);
      } catch (err) {
        console.error('Error fetching cumulative leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [maxEntries]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-500 text-white";
      default:
        return "bg-white border border-gray-200 text-gray-900";
    }
  };



  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cumulative leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <p className="text-red-600 mb-2">Error loading leaderboard</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Overall standings across all quiz sessions
          </p>
        </div>



        {/* Leaderboard */}
        {leaderboardData.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No participants to display</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {leaderboardData.map((participant) => {
              const rank = Number(participant.rank);
              return (
                <div
                  key={participant.user_id}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all hover:shadow-md ${getRankBg(rank)}`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-lg truncate">
                        {participant.user_name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs sm:text-sm opacity-80">
                        <span className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>{participant.sessions_participated} sessions</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Trophy className="h-3 w-3" />
                          <span>Best: {participant.best_session_score}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Avg: {participant.average_session_score.toFixed(1)}</span>
                        </span>
                      </div>
                      {rank <= 3 && (
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                          {rank === 1 ? "🏆 Overall Champion" : rank === 2 ? "🥈 Overall Runner-up" : "🥉 Overall Third Place"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base sm:text-xl font-bold">{participant.total_score}</p>
                    <p className="text-xs sm:text-sm opacity-80">total points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back Button */}
        {showBackButton && (
          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={onBack}
              className="btn-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
