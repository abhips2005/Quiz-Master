import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Users, Settings, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase, getSessionLeaderboard, recordGameSessionScore } from '../../lib/supabase';
import { GameSession, Participant } from '../../types';
import { useRealtime } from '../../hooks/useRealtime';
import { Leaderboard } from '../Shared/Leaderboard';
import { FlaggedPlayers } from './FlaggedPlayers';
import { Footer } from '../Layout/Footer';

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
  const [gameCompleted, setGameCompleted] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const loadParticipants = useCallback(async () => {
    try {
      console.log('Loading participants...');
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          users (
            name
          )
        `)
        .eq('session_id', session.id);
      
      if (error) throw error;
      console.log('Loaded participants:', data);
      console.log('First participant data structure:', data?.[0]);
      console.log('Each participant in lobby:');
      data?.forEach((p, i) => {
        console.log(`Participant ${i}:`, {
          id: p.id,
          nickname: p.nickname,
          score: p.score,
          user_id: p.user_id,
          current_question_index: p.current_question_index,
          users: p.users
        });
      });
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

  // Individual question progression - no longer need global auto-advance
  const checkAllAnswered = useCallback(async () => {
    // This function is no longer used since each player advances individually
    return false;
  }, []);

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
      
      // Record scores for cumulative leaderboard
      console.log('Recording session scores for cumulative leaderboard...');
      try {
        await recordGameSessionScore(session.id);
        console.log('Session scores recorded successfully');
      } catch (scoreError) {
        console.error('Error recording session scores:', scoreError);
        // Don't fail the entire operation if score recording fails
      }
      
      // Also record scores for any participants who haven't been recorded yet
      try {
        const { data: participants } = await supabase
          .from('participants')
          .select('user_id, score')
          .eq('session_id', session.id)
          .not('user_id', 'is', null);
        
        if (participants) {
          const { recordSessionScore } = await import('../../lib/supabase');
          for (const participant of participants) {
            if (participant.user_id && participant.score > 0) {
              try {
                await recordSessionScore(participant.user_id, session.id, participant.score);
                console.log(`Recorded score for user ${participant.user_id}: ${participant.score}`);
              } catch (error) {
                console.error(`Failed to record score for user ${participant.user_id}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error recording individual participant scores:', error);
      }
      
      // Fetch final leaderboard data
      console.log('Fetching leaderboard for session:', session.id);
      const { data: leaderboard, error: leaderboardError } = await getSessionLeaderboard(session.id);
      console.log('Leaderboard data received:', leaderboard);
      console.log('Leaderboard error:', leaderboardError);
      console.log('Each participant in leaderboard:');
      leaderboard?.forEach((p, i) => {
        console.log(`Participant ${i}:`, {
          id: p.id,
          nickname: p.nickname,
          score: p.score,
          user_id: p.user_id,
          users: p.users
        });
      });
      
      if (leaderboard) {
        setLeaderboardData(leaderboard);
      }
      
      // Show the final leaderboard instead of closing
      setGameCompleted(true);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }, [session.id]);

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

  // Individual question progression - no longer need global auto-advance
  const autoAdvanceIfReady = useCallback(async () => {
    // This function is no longer used since each player advances individually
  }, []);

  // Individual question progression - no longer need global timeout mechanism
  // Each player has their own timer and advances individually  
  
  // Subscribe to real-time updates for participant list only
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time update received:', payload.eventType, payload);
    
    // Always update participant list when there's any change
    loadParticipants();
    
    // No longer need auto-advance logic since each player advances individually
  }, [loadParticipants]);

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

  // Show final leaderboard when game is completed
  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl p-6 card-shadow mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quiz Complete!</h1>
                  <p className="text-gray-600">{quiz?.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Final Leaderboard */}
          <Leaderboard participants={leaderboardData} title="Final Results" />

          {/* Security Violations Report */}
          <div className="mt-6">
            <FlaggedPlayers sessionId={session.id} />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 bg-white rounded-xl p-6 card-shadow">
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
          
          <Footer />
        </div>
      </div>
    );
  }

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
             {quiz && (
               <div className="text-sm text-gray-600">
                 {participants.filter(p => (p.current_question_index || 0) >= quiz.questions.length).length} / {participants.length} completed
               </div>
             )}
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
                       {(participant.users?.name || participant.nickname).charAt(0).toUpperCase()}
                     </span>
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">
                       {participant.users?.name || participant.nickname}
                     </p>
                     {participant.users?.name && (
                       <p className="text-xs text-gray-400">@{participant.nickname}</p>
                     )}
                                           <p className="text-sm text-gray-500">Score: {participant.score}</p>
                      <p className="text-xs text-blue-600">
                        Question: {participant.current_question_index || 0} / {quiz?.questions?.length || 0}
                      </p>
                      {(participant.current_question_index || 0) >= (quiz?.questions?.length || 0) && (
                        <p className="text-xs text-green-600 font-medium">
                          ✅ Completed - Waiting for others
                        </p>
                      )}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Results Announcement */}
        {participants.some(p => (p.current_question_index || 0) >= (quiz?.questions?.length || 0)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 card-shadow mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 text-sm font-bold">!</span>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800">Results Will Be Announced Soon</h3>
            </div>
            <p className="text-yellow-700 text-sm mb-4">
              Some participants have completed the quiz. The final leaderboard will be displayed once all participants finish.
            </p>
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Completed:</strong> {participants.filter(p => (p.current_question_index || 0) >= (quiz?.questions?.length || 0)).length} / {participants.length} participants
              </p>
            </div>
          </div>
        )}

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
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Game Lobby</h2>
        </div>

        {/* Game PIN */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-8 text-white text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">Students can join with PIN:</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 sm:px-8 sm:py-4">
              <span className="text-2xl sm:text-4xl font-bold tracking-widest">{session.pin}</span>
            </div>
            <button
              onClick={handleCopyPin}
              className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            >
              {copied ? <Check className="h-5 w-5 sm:h-6 sm:w-6" /> : <Copy className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
          <p className="mt-3 sm:mt-4 text-purple-100 text-sm sm:text-base">
            Go to your quiz platform and enter this PIN to join the game!
          </p>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Participants ({participants.length})
            </h3>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={loadParticipants}
                className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 slide-in">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold text-sm sm:text-base">
                        {(participant.users?.name || participant.nickname).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {participant.users?.name || participant.nickname}
                      </p>
                      {participant.users?.name && (
                        <p className="text-xs text-gray-400 truncate">@{participant.nickname}</p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500">
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
        <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">Game Settings</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {session.settings.show_leaderboard ? 'Show leaderboard' : 'Hide leaderboard'} • 
                  {session.settings.time_pressure ? ' Time pressure' : ' No time pressure'} • 
                  {session.settings.allow_powerups ? ' Power-ups enabled' : ' Power-ups disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartGame}
              disabled={participants.length === 0}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base touch-manipulation"
            >
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};