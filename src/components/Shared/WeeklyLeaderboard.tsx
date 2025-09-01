import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, Calendar, Clock, Target } from 'lucide-react';
import { getWeeklyLeaderboard, getWeeklyCompetitions } from '../../lib/supabase';

interface WeeklyLeaderboardEntry {
  user_id: string;
  user_name: string;
  weekly_score: number;
  weekly_rank: number | bigint;
}

interface WeeklyCompetition {
  id: string;
  week_number: number;
  title: string;
  start_date: string;
  end_date: string;
}

interface WeeklyLeaderboardProps {
  weekNumber?: number;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  maxEntries?: number;
}

export const WeeklyLeaderboard: React.FC<WeeklyLeaderboardProps> = ({ 
  weekNumber,
  title,
  showBackButton = false,
  onBack,
  maxEntries = 10
}) => {
  const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardEntry[]>([]);
  const [weeklyCompetitions, setWeeklyCompetitions] = useState<WeeklyCompetition[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(weekNumber || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch weekly competitions
        const { data: competitions, error: competitionsError } = await getWeeklyCompetitions();
        if (competitionsError) throw competitionsError;
        
        setWeeklyCompetitions(competitions || []);
        
        // Set default week if none provided
        if (!weekNumber && competitions && competitions.length > 0) {
          setSelectedWeek(competitions[0].week_number);
        }
      } catch (err) {
        console.error('Error fetching weekly competitions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load competitions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [weekNumber]);

  useEffect(() => {
    const fetchWeeklyLeaderboard = async () => {
      if (!selectedWeek) return;
      
      try {
        setLoading(true);
        
        const { data: leaderboard, error: leaderboardError } = await getWeeklyLeaderboard(selectedWeek, maxEntries);
        if (leaderboardError) throw leaderboardError;
        
        setLeaderboardData(leaderboard || []);
      } catch (err) {
        console.error('Error fetching weekly leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyLeaderboard();
  }, [selectedWeek, maxEntries]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCurrentWeek = () => {
    const today = new Date();
    return weeklyCompetitions.find(comp => {
      const startDate = new Date(comp.start_date);
      const endDate = new Date(comp.end_date);
      return today >= startDate && today <= endDate;
    });
  };

  const currentWeek = getCurrentWeek();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading weekly leaderboard...</p>
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
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
            {title || `Week ${selectedWeek} Leaderboard`}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {weeklyCompetitions.find(c => c.week_number === selectedWeek)?.title || 'Weekly Results'}
          </p>
        </div>

        {/* Week Selector */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Select Week</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {weeklyCompetitions.map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedWeek(week.week_number)}
                className={`px-3 py-1 rounded-full border text-xs transition-all ${
                  week.week_number === selectedWeek
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                } ${
                  week.week_number === currentWeek?.week_number
                    ? 'ring-2 ring-blue-400 ring-offset-2'
                    : ''
                }`}
                title={`${week.title} (${formatDate(week.start_date)} - ${formatDate(week.end_date)})`}
              >
                Week {week.week_number}
                {week.week_number === currentWeek?.week_number && (
                  <span className="ml-1 text-xs">●</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Week Info */}
        {weeklyCompetitions.find(c => c.week_number === selectedWeek) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">
                {weeklyCompetitions.find(c => c.week_number === selectedWeek)?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(weeklyCompetitions.find(c => c.week_number === selectedWeek)?.start_date || '')} - {' '}
                {formatDate(weeklyCompetitions.find(c => c.week_number === selectedWeek)?.end_date || '')}
              </p>
              {currentWeek?.week_number === selectedWeek && (
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Current Week
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboardData.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">
              {selectedWeek ? `No participants for Week ${selectedWeek}` : 'No participants to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {leaderboardData.map((participant) => {
              const rank = Number(participant.weekly_rank);
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
                          <span>Rank #{rank}</span>
                        </span>
                      </div>
                      {rank <= 3 && (
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                          {rank === 1 ? "🏆 Week Winner" : rank === 2 ? "🥈 Week Runner-up" : "🥉 Week Third Place"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base sm:text-xl font-bold">{participant.weekly_score}</p>
                    <p className="text-xs sm:text-sm opacity-80">points</p>
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
