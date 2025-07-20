import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SecurityViolation {
  id: string;
  participant_id: string;
  violation_type: string;
  violation_count: number;
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  participant: {
    nickname: string;
    users?: {
      name: string;
    };
  };
}

interface FlaggedPlayersProps {
  sessionId: string;
  title?: string;
}

export const FlaggedPlayers: React.FC<FlaggedPlayersProps> = ({ 
  sessionId, 
  title = "Security Alerts"
}) => {
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSecurityViolations();
  }, [sessionId]);

  const loadSecurityViolations = async () => {
    try {
      const { data, error } = await supabase
        .from('security_violations')
        .select(`
          *,
          participants!inner (
            nickname,
            users (
              name
            )
          )
        `)
        .eq('session_id', sessionId)
        .eq('severity', 'high') // Only show high-severity violations
        .order('violation_count', { ascending: false });

      if (error) throw error;

      // Group violations by participant to avoid duplicates
      const groupedViolations = new Map<string, SecurityViolation>();
      
      data?.forEach((violation: any) => {
        const participantId = violation.participant_id;
        const existing = groupedViolations.get(participantId);
        
        if (!existing || violation.violation_count > existing.violation_count) {
          groupedViolations.set(participantId, {
            ...violation,
            participant: violation.participants
          });
        }
      });

      setViolations(Array.from(groupedViolations.values()));
    } catch (error) {
      console.error('Error loading security violations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (violations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-green-600">
          ✅ No severe security violations detected during this quiz.
        </p>
      </div>
    );
  }

  const getViolationTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'tab_switch': 'Tab Switching',
      'keyboard_shortcut': 'Keyboard Shortcuts',
      'right_click': 'Right-Click Attempts',
      'devtools': 'Developer Tools',
      'copy_paste': 'Copy/Paste Attempts',
      'suspicious_activity': 'Other Suspicious Activity'
    };
    return types[type] || type;
  };

  return (
    <div className="bg-white rounded-xl p-4 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            {violations.length} player{violations.length === 1 ? '' : 's'}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>

      <div className="space-y-2">
        {violations.map((violation, index) => (
          <div
            key={violation.id}
            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-red-600">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium text-red-900">
                  {violation.participant.users?.name || violation.participant.nickname}
                </p>
                <p className="text-xs text-red-600">
                  {violation.violation_count} violation{violation.violation_count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            
            {showDetails && (
              <div className="text-right">
                <p className="text-xs text-red-700 font-medium">
                  {getViolationTypeDisplay(violation.violation_type)}
                </p>
                <p className="text-xs text-red-500">
                  {new Date(violation.detected_at).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {violations.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> These players showed suspicious activity patterns that may indicate attempts to cheat. 
            Consider reviewing their performance manually or implementing additional verification measures.
          </p>
        </div>
      )}
    </div>
  );
};
