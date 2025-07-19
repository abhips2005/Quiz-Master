import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Users, Settings, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GameSession, Participant } from '../../types';
import { useRealtime } from '../../hooks/useRealtime';

interface GameLobbyProps {
  session: GameSession;
  onClose: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ session, onClose }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quiz, setQuiz] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadParticipants = useCallback(async () => {
    try {
      console.log('Loading participants...');
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', session.id);
      
      if (error) throw error;
      console.log('Loaded participants:', data);
      setParticipants(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }, [session.id]);

  useEffect(() => {
    loadQuiz(); // Load quiz immediately when component mounts
    
    // Only poll for participants before the game starts
    if (!gameStarted) {
      loadParticipants();
      
      // Poll for new participants every 3 seconds until game starts
      const interval = setInterval(() => {
        loadParticipants();
      }, 3000);

      return () => clearInterval(interval);
    } else {
      // Load participants once when game starts, then add polling for score updates
      loadParticipants();
      
      // During game, poll every 2 seconds to catch any missed score updates
      const gameInterval = setInterval(() => {
        console.log('Polling for participant score updates during game');
        loadParticipants();
      }, 2000);

      return () => clearInterval(gameInterval);
    }
  }, [loadParticipants, gameStarted]);

  const loadQuiz = async () => {
    try {
      console.log('Loading quiz for session:', session.quiz_id);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*, questions(*)')
        .eq('id', session.quiz_id)
        .single();
      
      if (error) throw error;
      console.log('Quiz loaded:', data);
      // Sort questions by order_index
      if (data.questions) {
        data.questions.sort((a: any, b: any) => a.order_index - b.order_index);
      }
      setQuiz(data);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const checkAllAnswered = useCallback(async () => {
    if (!autoAdvance || participants.length === 0 || !gameStarted) return false;

    try {
      const { data: answeredParticipants, error } = await supabase
        .from('participants')
        .select('id, last_answered_question')
        .eq('session_id', session.id)
        .gte('last_answered_question', currentQuestionIndex);

      if (error) throw error;

      // If all participants have answered the current question
      if (answeredParticipants && answeredParticipants.length >= participants.length) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if all answered:', error);
      return false;
    }
  }, [autoAdvance, participants.length, gameStarted, session.id, currentQuestionIndex]);

  const handleEndGame = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;
      // Could redirect to final results or close
      onClose();
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }, [session.id, onClose]);

  const handleNextQuestion = useCallback(async () => {
    if (!quiz || currentQuestionIndex >= quiz.questions.length - 1) {
      // End the game
      handleEndGame();
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          current_question: nextIndex
        })
        .eq('id', session.id);

      if (error) throw error;
      setCurrentQuestionIndex(nextIndex);
      setQuestionStartTime(new Date());
      setShowResults(false);
    } catch (error) {
      console.error('Error advancing to next question:', error);
    }
  }, [quiz, currentQuestionIndex, session.id, handleEndGame, setCurrentQuestionIndex, setQuestionStartTime, setShowResults]);

  const autoAdvanceIfReady = useCallback(async () => {
    const shouldAdvance = await checkAllAnswered();
    
    if (shouldAdvance) {
      // Show results and advance immediately
      setShowResults(true);
      
      // Auto advance with minimal delay
      setTimeout(() => {
        handleNextQuestion();
      }, 100); // Reduced to just 100ms
    }
  }, [checkAllAnswered, handleNextQuestion, setShowResults]);

  // Timeout mechanism - auto advance after question time limit + buffer
  useEffect(() => {
    if (!gameStarted || !questionStartTime || !quiz || !autoAdvance) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const timeoutDuration = (currentQuestion.time_limit + 5) * 1000; // Question time + 5 second buffer

    const timeout = setTimeout(() => {
      setShowResults(true);
      
      setTimeout(() => {
        handleNextQuestion();
      }, 500); // Reduced to 500ms
    }, timeoutDuration);

    return () => clearTimeout(timeout);
  }, [questionStartTime, currentQuestionIndex, gameStarted, quiz, autoAdvance]);  
  
  // Subscribe to real-time updates with stable callback
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time update received:', payload.eventType, payload);
    
    // Always update participant list when there's any change
    loadParticipants();
    
    // Only handle participant updates during the game for answer checking
    if (gameStarted && payload.eventType === 'UPDATE') {
      console.log('Participant updated during game, checking auto-advance');
      autoAdvanceIfReady();
    }
  }, [loadParticipants, gameStarted, autoAdvanceIfReady]);

  useRealtime(
    `participants_${session.id}`,
    'participants',
    `session_id=eq.${session.id}`,
    handleRealtimeUpdate
  );

  const handleCopyPin = async () => {
    await navigator.clipboard.writeText(session.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (participants.length === 0) {
      alert('Wait for at least one participant to join!');
      return;
    }

    console.log('Starting game...', { quiz: !!quiz, participants: participants.length });

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'active', 
          started_at: new Date().toISOString(),
          current_question: 0
        })
        .eq('id', session.id);

      if (error) throw error;
      
      console.log('Game session updated, setting game started...');
      setGameStarted(true);
      setCurrentQuestionIndex(0);
      setQuestionStartTime(new Date());
      setShowResults(false);
      
      console.log('Game started state set');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };



  const handleShowResults = () => {
    setShowResults(true);
  };

  console.log('Render state:', { gameStarted, quiz: !!quiz, participants: participants.length, session });

  if (gameStarted && quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex >= quiz.questions.length - 1;

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Live Game Control</h2>
                <p className="text-gray-600">Managing: {quiz.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Live
              </div>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Auto-advance</span>
              </label>
              <span className="text-sm text-gray-600">PIN: {session.pin}</span>
            </div>
          </div>
        </div>

        {/* Current Question Display */}
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </h3>
            <div className="flex space-x-2">
              {!showResults && (
                <button
                  onClick={handleShowResults}
                  className="btn-secondary"
                >
                  Show Results
                </button>
              )}
              <button
                onClick={handleNextQuestion}
                className="btn-primary"
              >
                {isLastQuestion ? 'End Game' : 'Next Question'}
              </button>
            </div>
          </div>
          
          {currentQuestion && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-lg font-medium text-gray-900 mb-3">
                {currentQuestion.question}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      index === currentQuestion.correct_answer
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showResults && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Live Results</h4>
              <p className="text-blue-700">
                Results display would go here (answer distribution, participant responses, etc.)
              </p>
            </div>
          )}
        </div>

        {/* Participants Status */}
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Participants ({participants.length})
            </h3>
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={loadParticipants}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Scores</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map((participant) => (
              <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">
                      {participant.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{participant.nickname}</p>
                    <p className="text-sm text-gray-500">Score: {participant.score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <h3 className="text-xl font-semibold mb-4">Game Statistics</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{participants.length}</p>
              <p className="text-sm text-gray-600">Players</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{currentQuestionIndex + 1}</p>
              <p className="text-sm text-gray-600">Current Question</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{quiz.questions.length}</p>
              <p className="text-sm text-gray-600">Total Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Game Lobby</h2>
        </div>

        {/* Game PIN */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white text-center mb-6">
          <h3 className="text-2xl font-bold mb-4">Students can join with PIN:</h3>
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-8 py-4">
              <span className="text-4xl font-bold tracking-widest">{session.pin}</span>
            </div>
            <button
              onClick={handleCopyPin}
              className="p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            >
              {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
            </button>
          </div>
          <p className="mt-4 text-purple-100">
            Go to your quiz platform and enter this PIN to join the game!
          </p>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Participants ({participants.length})
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadParticipants}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Waiting for participants...</h4>
              <p className="text-gray-600">Students will appear here when they join with the PIN</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="border border-gray-200 rounded-lg p-4 slide-in">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {participant.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.nickname}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(participant.join_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Game Settings</p>
                <p className="text-sm text-gray-600">
                  {session.settings.show_leaderboard ? 'Show leaderboard' : 'Hide leaderboard'} • 
                  {session.settings.time_pressure ? ' Time pressure' : ' No time pressure'} • 
                  {session.settings.allow_powerups ? ' Power-ups enabled' : ' Power-ups disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartGame}
              disabled={participants.length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};