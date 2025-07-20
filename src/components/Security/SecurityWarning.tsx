import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface SecurityWarningProps {
  isQuizActive: boolean;
  suspiciousActivityCount: number;
}

export const SecurityWarning: React.FC<SecurityWarningProps> = ({ 
  isQuizActive, 
  suspiciousActivityCount 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(isQuizActive && suspiciousActivityCount > 0);

  useEffect(() => {
    setIsVisible(isQuizActive && suspiciousActivityCount > 0);
  }, [isQuizActive, suspiciousActivityCount]);

  if (!isVisible) return null;

  const getSeverityLevel = () => {
    if (suspiciousActivityCount >= 10) return 'high';
    if (suspiciousActivityCount >= 5) return 'medium';
    return 'low';
  };

  const severity = getSeverityLevel();

  const severityColors = {
    low: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    medium: 'bg-orange-50 border-orange-300 text-orange-800',
    high: 'bg-red-50 border-red-300 text-red-800'
  };

  const severityIcons = {
    low: <Shield className="h-4 w-4" />,
    medium: <AlertTriangle className="h-4 w-4" />,
    high: <AlertTriangle className="h-4 w-4" />
  };

  return (
    <div className={`rounded-lg border-l-4 px-3 py-2 mb-3 ${severityColors[severity]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {severityIcons[severity]}
          <div className="text-sm">
            <span className="font-medium">Security Alert</span>
            <span className="ml-1">({suspiciousActivityCount} violation{suspiciousActivityCount === 1 ? '' : 's'})</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs underline hover:no-underline flex items-center"
        >
          {showDetails ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          {showDetails ? 'Hide' : 'Info'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-current/20">
          <div className="text-xs space-y-1">
            <p className="font-medium">Quick Guidelines:</p>
            <p>• Keep focus on quiz • No tab switching • Avoid shortcuts</p>
            {severity === 'high' && (
              <p className="font-semibold text-red-700">⚠️ Multiple violations - session may be flagged</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Additional component for quiz instructions with security notice
export const QuizSecurityNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Quiz Security & Fair Play Policy
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>This quiz session is monitored to ensure fairness and academic integrity.</p>
            <div className="text-xs">
              <strong>The following are monitored and discouraged:</strong>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                <li>Tab switching or window minimizing</li>
                <li>Right-click actions and keyboard shortcuts</li>
                <li>Copy/paste operations</li>
                <li>Developer tools usage</li>
                <li>Screenshot attempts</li>
              </ul>
            </div>
            <p className="text-xs italic">
              Focus on the quiz content and avoid any actions that might be flagged as suspicious.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
