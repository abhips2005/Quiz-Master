import React, { useState } from 'react';
import { GamepadIcon, ArrowRight, Users, Loader2 } from 'lucide-react';
import { getGameSessionByPin, joinGameSession, supabase } from '../../lib/supabase';

interface JoinGameProps {
  onJoinGame: (gameSession: any) => void;
  userId?: string;
}

export const JoinGame: React.FC<JoinGameProps> = ({ onJoinGame, userId }) => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'pin' | 'nickname'>('pin');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data: session, error } = await getGameSessionByPin(pin.toUpperCase());
      if (error) throw error;

      if (!session) {
        throw new Error('Game not found. Please check the PIN and try again.');
      }

      if (session.status === 'completed') {
        throw new Error('This game has already ended.');
      }

      setStep('nickname');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data: session, error: sessionError } = await getGameSessionByPin(pin.toUpperCase());
      if (sessionError) throw sessionError;

      // Check current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user when joining:', user);
      
      const actualUserId = userId || user?.id;
      console.log('Joining session:', session.id, 'with nickname:', nickname.trim(), 'userId:', actualUserId);
      
      const { data: participant, error: joinError } = await joinGameSession(
        session.id,
        nickname.trim(),
        actualUserId
      );
      
      console.log('Join result:', { participant, joinError });
      
      if (joinError) throw joinError;

      onJoinGame({ ...session, participantId: participant.id, userId: actualUserId });
    } catch (error: any) {
      console.error('Error joining game:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
          <GamepadIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Live Quiz</h3>
        <p className="text-gray-600">
          {step === 'pin' 
            ? 'Enter the PIN provided by your teacher'
            : 'Choose a nickname to join the game'
          }
        </p>
      </div>

      {step === 'pin' ? (
        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              Game PIN
            </label>
            <input
              type="text"
              id="pin"
              className="input-field text-center text-2xl font-bold tracking-widest uppercase"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoinSubmit} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Your Nickname
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="nickname"
                className="input-field pl-10"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('pin')}
              className="flex-1 btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Join Game</span>
                  <GamepadIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};