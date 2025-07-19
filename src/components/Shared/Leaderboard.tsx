import React from 'react';
import { Trophy, Medal, Award, Users } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  users?: {
    name: string;
  };
}

interface LeaderboardProps {
  participants: LeaderboardEntry[];
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  participants, 
  title = "Final Leaderboard",
  showBackButton = false,
  onBack 
}) => {
  console.log('Leaderboard component received participants:', participants);
  
  // Sort participants by score (descending) and take top 10
  const topParticipants = [...participants]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  console.log('Top participants after sorting:', topParticipants);

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

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm sm:text-base text-gray-600">Congratulations to all participants!</p>
        </div>

        {topParticipants.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No participants to display</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {topParticipants.map((participant, index) => {
              const rank = index + 1;
              return (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all hover:shadow-md ${getRankBg(rank)}`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-lg truncate">
                        {participant.users?.name || participant.nickname}
                      </p>
                      {participant.users?.name && (
                        <p className="text-xs opacity-60 truncate">@{participant.nickname}</p>
                      )}
                      {rank <= 3 && (
                        <p className="text-xs sm:text-sm opacity-80">
                          {rank === 1 ? "🏆 Champion" : rank === 2 ? "🥈 Runner-up" : "🥉 Third Place"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base sm:text-xl font-bold">{participant.score}</p>
                    <p className="text-xs sm:text-sm opacity-80">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
