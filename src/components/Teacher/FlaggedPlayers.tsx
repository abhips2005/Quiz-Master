import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, EyeOff, Shield, User } from 'lucide-react';
import { getFlaggedPlayersForSession } from '../../lib/supabase';

interface FlaggedPlayersProps {
  sessionId: string;
}

interface FlaggedPlayer {
  participant: {
    nickname: string;
    user_id?: string;
    users?: {
      name: string;
    };
  };
  totalViolations: number;
  violations: Array<{
    violation_type: string;
    violation_count: number;
    created_at: string;
  }>;
  riskLevel: 'medium' | 'high' | 'severe';
}

export const FlaggedPlayers: React.FC<FlaggedPlayersProps> = ({ sessionId }) => {
  const [flaggedPlayers, setFlaggedPlayers] = useState<FlaggedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<string[]>([]);

  useEffect(() => {
    const loadFlaggedPlayers = async () => {
      try {
        const { data, error } = await getFlaggedPlayersForSession(sessionId);
        if (error) {
          console.error('Error loading flagged players:', error);
        } else {
          setFlaggedPlayers((data as FlaggedPlayer[]) || []);
        }
      } catch (error) {
        console.error('Error loading flagged players:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlaggedPlayers();
  }, [sessionId]);

  const toggleDetails = (playerId: string) => {
    setShowDetails(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      default: return 'border-gray-300 bg-gray-50 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <Shield className="h-5 w-5 text-yellow-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatViolationType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-5 w-5 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (flaggedPlayers.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-800">Security Report: All Clear</h3>
        </div>
        <p className="text-sm text-green-700 mt-1">
          No significant security violations detected during this quiz session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b bg-red-50">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-medium text-red-800">Security Report: Flagged Players</h3>
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {flaggedPlayers.length} player{flaggedPlayers.length !== 1 ? 's' : ''} flagged
          </span>
        </div>
        <p className="text-sm text-red-700 mt-1">
          The following players had significant security violations during the quiz:
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {flaggedPlayers.map((player, index) => {
          const playerId = `${player.participant.nickname}-${index}`;
          const isExpanded = showDetails.includes(playerId);
          const playerName = player.participant.users?.name || player.participant.nickname;

          return (
            <div key={playerId} className={`p-4 ${getRiskColor(player.riskLevel)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRiskIcon(player.riskLevel)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{playerName}</span>
                      {player.participant.users?.name && (
                        <span className="text-sm opacity-75">({player.participant.nickname})</span>
                      )}
                    </div>
                    <div className="text-sm opacity-90">
                      {player.totalViolations} violation{player.totalViolations !== 1 ? 's' : ''} • 
                      <span className="font-medium ml-1">
                        {player.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleDetails(playerId)}
                  className="flex items-center space-x-1 text-sm hover:opacity-75 transition-opacity"
                >
                  {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <h4 className="font-medium text-sm mb-2">Violation Breakdown:</h4>
                  <div className="grid gap-2">
                    {player.violations.map((violation, vIndex) => (
                      <div key={vIndex} className="flex justify-between text-sm">
                        <span>{formatViolationType(violation.violation_type)}</span>
                        <span className="font-medium">
                          {violation.violation_count} time{violation.violation_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {player.riskLevel === 'severe' && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      <strong>⚠️ Recommendation:</strong> This session should be reviewed for potential academic dishonesty.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600 border-t">
        <p>
          <strong>Note:</strong> Security violations include tab switching, right-clicking, keyboard shortcuts, 
          developer tools usage, and other suspicious activities during the quiz.
        </p>
      </div>
    </div>
  );
};
