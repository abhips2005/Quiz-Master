import React from 'react';
import { Trophy, Medal, Award, Users } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
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
  // Sort participants by score (descending) and take top 10
  const topParticipants = [...participants]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl p-8 card-shadow">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">Congratulations to all participants!</p>
        </div>

        {topParticipants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No participants to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topParticipants.map((participant, index) => {
              const rank = index + 1;
              return (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md ${getRankBg(rank)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{participant.nickname}</p>
                      {rank <= 3 && (
                        <p className="text-sm opacity-80">
                          {rank === 1 ? "🏆 Champion" : rank === 2 ? "🥈 Runner-up" : "🥉 Third Place"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{participant.score}</p>
                    <p className="text-sm opacity-80">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showBackButton && (
          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
