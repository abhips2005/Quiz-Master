import React, { useState, useEffect, useRef } from 'react';
import { Clock, Trophy, Users, Zap, ArrowLeft } from 'lucide-react';
import { supabase, getSessionLeaderboard, checkAndAwardBadges, getUserStats, recordGameSessionScore } from '../../lib/supabase';
import { useRealtime } from '../../hooks/useRealtime';
import { useAntiCheating } from '../../hooks/useAntiCheating';
import { Leaderboard } from '../Shared/Leaderboard';
import { Footer } from '../Layout/Footer';
import { SecurityWarning, QuizSecurityNotice } from '../Security/SecurityWarning';

interface GamePlayProps {
  session: any;
  onLeave: () => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({ session, onLeave }) => {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'question' | 'results' | 'waiting_for_others' | 'ended'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const resultsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [cachedQuizData, setCachedQuizData] = useState<any>(null); // Cache quiz data
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean>(false); // Track answer correctness
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0); // Track total correct answers
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [isFirstGame, setIsFirstGame] = useState(false);
  const [suspiciousActivities, setSuspiciousActivities] = useState<string[]>([]);

  // Enable anti-cheating protection during active gameplay
  const { suspiciousActivityCount } = useAntiCheating({
    sessionId: session.id,
    participantId: session.participantId,
    disableDevTools: gameState === 'question',
    disableRightClick: gameState === 'question',
    disableTextSelection: gameState === 'question',
    disablePrintScreen: gameState === 'question',
    onSuspiciousActivity: (activity) => {
      setSuspiciousActivities(prev => [...prev, activity]);
      // Log suspicious activity to backend (could be implemented)
      console.warn('Cheating attempt detected:', activity);
    }
  });

  useEffect(() => {
    // Load user data to check if this is their first game
    const loadUserData = async () => {
      try {
        const userId = session.userId || session.user_id;
        if (!userId) return;
        
        const { data: userStats } = await getUserStats(userId);
        if (userStats) {
          // Check total games from participants table
          const { data: gameCount } = await supabase
            .from('participants')
            .select('id')
            .eq('user_id', userId);
            
          const totalGames = gameCount?.length || 0;
          setTotalGamesPlayed(totalGames);
          setIsFirstGame(totalGames === 0);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
    
    // Check if game is already active when component loads
    if (session.status === 'active') {
      setGameState('playing');
      
      // Load the player's individual current question
      const loadPlayerQuestion = async () => {
        try {
          const { data: participant } = await supabase
            .from('participants')
            .select('current_question_index')
            .eq('id', session.participantId)
            .single();
          
          if (participant) {
            const questionIndex = participant.current_question_index || 0;
            console.log('Loading player\'s individual question at index:', questionIndex);
            loadCurrentQuestion(questionIndex);
            setCurrentQuestionIndex(questionIndex);
          } else {
            // Fallback to session question if participant not found
            const questionIndex = session.current_question || 0;
            loadCurrentQuestion(questionIndex);
            setCurrentQuestionIndex(questionIndex);
          }
        } catch (error) {
          console.error('Error loading player question:', error);
          // Fallback to session question
          const questionIndex = session.current_question || 0;
          loadCurrentQuestion(questionIndex);
          setCurrentQuestionIndex(questionIndex);
        }
      };
      
      loadPlayerQuestion();
    }

    // Polling mechanism as fallback for game status changes only
    const pollInterval = setInterval(async () => {
      try {
        const { data: updatedSession, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        if (error) {
          return;
        }
        
        if (updatedSession.status === 'active' && gameState === 'waiting') {
          setGameState('playing');
          // Load player's individual question
          const { data: participant } = await supabase
            .from('participants')
            .select('current_question_index')
            .eq('id', session.participantId)
            .single();
          
          if (participant) {
            const questionIndex = participant.current_question_index || 0;
            loadCurrentQuestion(questionIndex);
            setCurrentQuestionIndex(questionIndex);
          }
        } else if (updatedSession.status === 'completed' && gameState !== 'ended') {
          // Load final leaderboard when game ends
          const { data: leaderboardData } = await getSessionLeaderboard(session.id);
          if (leaderboardData) {
            setFinalLeaderboard(leaderboardData);
          }
          
          // Check for perfect score badge
          const userId = session.userId || session.user_id;
          if (userId && cachedQuizData) {
            const totalQuestions = cachedQuizData.questions?.length || 0;
            const isPerfectScore = totalQuestions > 0 && totalCorrectAnswers === totalQuestions;
            
            console.log('Perfect score check (first location):', {
              totalQuestions,
              totalCorrectAnswers,
              isPerfectScore,
              userId
            });
            
            if (isPerfectScore) {
              console.log('Perfect score achieved, checking badge for user:', userId);
              checkAndAwardBadges(userId, {
                gameCompleted: true,
                perfectScore: true,
                totalGames: totalGamesPlayed + 1
              }).then(badges => {
                console.log('Perfect score badges returned:', badges);
                if (badges.length > 0) {
                  setNewBadges(prev => [...prev, ...badges]);
                }
              });
            }
          }
          
          setGameState('ended');
        }
        
        // No longer check for global question progression - each player advances individually
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 500); // Poll every 500ms for fast responsiveness

    return () => clearInterval(pollInterval);
  }, [gameState, session.id]);

  // Subscribe to game session updates
  useRealtime(
    `game_session_${session.id}`,
    'game_sessions',
    `id=eq.${session.id}`,
    (payload) => {
      handleGameUpdate(payload);
    }
  );

  // Polling mechanism for waiting for others to complete
  useEffect(() => {
    if (gameState === 'waiting_for_others') {
      const checkCompletionInterval = setInterval(async () => {
        try {
          const { data: allParticipants } = await supabase
            .from('participants')
            .select('current_question_index')
            .eq('session_id', session.id);
          
          if (allParticipants && cachedQuizData) {
            const totalQuestions = cachedQuizData.questions.length;
            const allCompleted = allParticipants.every(p => 
              (p.current_question_index || 0) >= totalQuestions
            );
            
            if (allCompleted) {
              console.log('All participants completed, transitioning to ended state');
              setGameState('ended');
            }
          }
        } catch (error) {
          console.error('Error checking completion status:', error);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(checkCompletionInterval);
    }
  }, [gameState, session.id, cachedQuizData]);

  const handleGameUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE') {
      const updatedSession = payload.new;
      
      if (updatedSession.status === 'active') {
        setGameState('playing');
        // Load player's individual question
        const loadPlayerQuestion = async () => {
          try {
            const { data: participant } = await supabase
              .from('participants')
              .select('current_question_index')
              .eq('id', session.participantId)
              .single();
            
            if (participant) {
              const questionIndex = participant.current_question_index || 0;
              loadCurrentQuestion(questionIndex);
              setCurrentQuestionIndex(questionIndex);
            }
          } catch (error) {
            console.error('Error loading player question in real-time update:', error);
          }
        };
        
        loadPlayerQuestion();
      } else if (updatedSession.status === 'completed') {
        // Record scores for cumulative leaderboard
        console.log('Recording session scores for cumulative leaderboard...');
        recordGameSessionScore(session.id).then((result) => {
          console.log('Session scores recorded:', result);
        }).catch((error) => {
          console.error('Error recording session scores:', error);
        });
        
        // Load final leaderboard when game ends
        getSessionLeaderboard(session.id).then(({ data: leaderboardData }) => {
          if (leaderboardData) {
            setFinalLeaderboard(leaderboardData);
          }
        });
        
        // Check for perfect score badge
        const userId = session.userId || session.user_id;
        if (userId && cachedQuizData) {
          const totalQuestions = cachedQuizData.questions?.length || 0;
          const isPerfectScore = totalQuestions > 0 && totalCorrectAnswers === totalQuestions;
          
          console.log('Perfect score check (second location):', {
            totalQuestions,
            totalCorrectAnswers,
            isPerfectScore,
            userId
          });
          
          if (isPerfectScore) {
            console.log('Perfect score achieved, checking badge for user:', userId);
            checkAndAwardBadges(userId, {
              gameCompleted: true,
              perfectScore: true,
              totalGames: totalGamesPlayed + 1
            }).then(badges => {
              console.log('Perfect score badges returned:', badges);
              if (badges.length > 0) {
                setNewBadges(prev => [...prev, ...badges]);
              }
            });
          }
        }
        
        setGameState('ended');
      }
      
      // No longer handle global question progression - each player advances individually
    }
  };

  const loadCurrentQuestion = async (questionIndex: number) => {
    try {
      console.log('Loading question at index:', questionIndex, 'current index:', currentQuestionIndex);
      
      // Prevent loading the same question multiple times
      if (questionIndex === currentQuestionIndex && gameState === 'question') {
        console.log('Skipping question load - same index and already in question state');
        return;
      }
      
      // Clear any existing results timeout
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
        resultsTimeoutRef.current = null;
      }
      
      // Use cached data if available, otherwise fetch
      let quiz = cachedQuizData;
      if (!quiz) {
        const { data: fetchedQuiz, error } = await supabase
          .from('quizzes')
          .select('*, questions(*)')
          .eq('id', session.quiz_id)
          .single();

        if (error) throw error;
        quiz = fetchedQuiz;
        setCachedQuizData(quiz); // Cache for future use
      }

      // Sort questions by order_index to ensure correct order
      const sortedQuestions = quiz.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];
      const question = sortedQuestions[questionIndex];
      
      if (question) {
        console.log('Setting question:', question.question.substring(0, 50) + '...');
        // Immediately set the state to question to override any results state
        setCurrentQuestion(question);
        setTimeLeft(question.time_limit);
        setSelectedAnswer(null);
        setLastAnswerCorrect(false); // Reset answer correctness
        setGameState('question');
      } else {
        console.error('Question not found at index:', questionIndex);
      }
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(answerIndex);
      submitAnswer(answerIndex);
    }
  };

  const submitAnswer = async (answerIndex: number) => {
    try {
      const timeTaken = currentQuestion.time_limit - timeLeft;
      const isCorrect = answerIndex === currentQuestion.correct_answer;
      
      // Calculate points based on correctness and speed
      let points = 0;
      if (isCorrect) {
        const speedBonus = Math.max(0, (timeLeft / currentQuestion.time_limit) * 0.5);
        points = Math.round(currentQuestion.points * (1 + speedBonus));
      }

      // Insert the answer
      const { error: answerError } = await supabase
        .from('answers')
        .insert([{
          participant_id: session.participantId,
          question_id: currentQuestion.id,
          answer: answerIndex,
          time_taken: timeTaken,
        }]);

      if (answerError) throw answerError;

      // Update participant score and mark as answered for current question
      const newScore = isCorrect ? score + points : score;
      
      const { error: participantError } = await supabase
        .from('participants')
        .update({
          score: newScore,
          streak: isCorrect ? streak + 1 : 0,
          // Track which question was last answered for individual progression
          last_answered_question: currentQuestion.order_index,
          // Add individual question progress tracking
          current_question_index: currentQuestionIndex + 1
        })
        .eq('id', session.participantId);

        if (participantError) {
          console.error('Error updating participant:', participantError);
          throw participantError;
        }      // Update local score and streak
      if (isCorrect) {
        setScore(newScore);
        setStreak(prev => prev + 1);
        setTotalCorrectAnswers(prev => prev + 1); // Increment correct answers counter
      } else {
        setStreak(0);
      }

      // Store the correctness for display
      setLastAnswerCorrect(isCorrect);
      
      // Check and award badges
      const userId = session.userId || session.user_id;
      console.log('Badge check - session:', { userId: session.userId, user_id: session.user_id, resolved: userId });
      
      if (userId) {
        console.log('Checking badges for user:', userId, 'with context:', {
          answerTime: timeTaken,
          streak: isCorrect ? streak + 1 : 0,
          isFirstGame: isFirstGame && currentQuestionIndex === 0,
          totalGames: totalGamesPlayed + (currentQuestionIndex === 0 ? 1 : 0)
        });
        
        const currentStreak = isCorrect ? streak + 1 : 0;
        const badges = await checkAndAwardBadges(userId, {
          answerTime: timeTaken,
          streak: currentStreak,
          isFirstGame: isFirstGame && currentQuestionIndex === 0, // Only on first question of first game
          totalGames: totalGamesPlayed + (currentQuestionIndex === 0 ? 1 : 0) // Include current game
        });
        
        console.log('Badges returned from checkAndAwardBadges:', badges);
        
        if (badges.length > 0) {
          setNewBadges(prev => [...prev, ...badges]);
        }
      } else {
        console.log('No userId found for badge checking');
      }

      // Show result immediately
      setGameState('results');
      
      // Auto-advance to next question immediately for this player
      resultsTimeoutRef.current = setTimeout(() => {
        console.log('Auto-advancing to next question for individual player');
        const nextQuestionIndex = currentQuestionIndex + 1;
        
        // Check if there are more questions
        if (cachedQuizData && nextQuestionIndex < cachedQuizData.questions.length) {
          loadCurrentQuestion(nextQuestionIndex);
          setCurrentQuestionIndex(nextQuestionIndex);
        } else {
          // Game is complete for this player
          console.log('Game complete for this player');
          
          // Check if this is the last question and determine next state
          const checkAndDetermineNextState = async () => {
            try {
              // Check if all participants have completed the quiz
              const { data: allParticipants } = await supabase
                .from('participants')
                .select('current_question_index')
                .eq('session_id', session.id);
              
              if (allParticipants) {
                const totalQuestions = cachedQuizData.questions.length;
                const allCompleted = allParticipants.every(p => 
                  (p.current_question_index || 0) >= totalQuestions
                );
                
                // For single player, go directly to ended state
                if (allParticipants.length === 1) {
                  console.log('Single player detected, completing session immediately');
                  await completeSession();
                  setGameState('ended');
                } else if (allCompleted) {
                  // All participants have completed
                  console.log('All participants completed, completing session');
                  await completeSession();
                  setGameState('ended');
                } else {
                  // Some participants are still playing, show waiting screen
                  console.log('Some participants still playing, showing waiting screen');
                  setGameState('waiting_for_others');
                }
              }
            } catch (error) {
              console.error('Error checking session completion:', error);
              // Fallback to ended state
              setGameState('ended');
            }
          };
          
          // Function to complete the session and record scores
          const completeSession = async () => {
            try {
              // Mark the session as completed
              const { error: sessionError } = await supabase
                .from('game_sessions')
                .update({ 
                  status: 'completed',
                  ended_at: new Date().toISOString()
                })
                .eq('id', session.id);
              
              if (sessionError) {
                console.error('Error marking session as completed:', sessionError);
              } else {
                console.log('Session marked as completed successfully');
                
                // Record scores for cumulative leaderboard
                console.log('Recording session scores for cumulative leaderboard...');
                try {
                  const { recordGameSessionScore } = await import('../../lib/supabase');
                  await recordGameSessionScore(session.id);
                  console.log('Session scores recorded successfully');
                } catch (scoreError) {
                  console.error('Error recording session scores:', scoreError);
                }
              }
            } catch (error) {
              console.error('Error completing session:', error);
            }
          };
          
          checkAndDetermineNextState();
        }
      }, 1000); // Show results for 1 second before advancing

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && gameState === 'question') {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'question' && selectedAnswer === null) {
      // Time's up, submit null answer
      submitAnswer(-1);
    }
  }, [timeLeft, gameState, selectedAnswer]);

  const getAnswerClassName = (index: number) => {
    if (selectedAnswer === null) {
      return 'bg-white border-gray-300 hover:border-purple-500 hover:bg-purple-50';
    }
    
    if (index === currentQuestion.correct_answer) {
      return 'bg-green-100 border-green-500 text-green-800';
    } else if (index === selectedAnswer) {
      return 'bg-red-100 border-red-500 text-red-800';
    } else {
      return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  if (gameState === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <div className="bg-white rounded-xl p-6 sm:p-8 card-shadow">
          <div className="pulse-animation mb-4 sm:mb-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Waiting for game to start...</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            You've successfully joined the game! The teacher will start the quiz soon.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
            <span>Game PIN: <strong>{session.pin}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate max-w-full">Quiz: <strong>{session.quizzes?.title}</strong></span>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6">
            <QuizSecurityNotice />
          </div>
          
          <button
            onClick={onLeave}
            className="mt-4 sm:mt-6 btn-secondary flex items-center space-x-2 mx-auto text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Leave Game</span>
          </button>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 quiz-content">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2 bg-purple-100 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
              <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
              <span className="font-semibold text-purple-800 text-sm sm:text-base">{score}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 bg-orange-100 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
              <Zap className="h-3 w-3 sm:h-5 sm:w-5 text-orange-600" />
              <span className="font-semibold text-orange-800 streak-fire text-sm sm:text-base">{streak}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 bg-red-100 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
            <Clock className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
            <span className="font-bold text-red-800 text-lg sm:text-xl">{timeLeft}s</span>
          </div>
        </div>

        {/* Security Warning */}
        <SecurityWarning 
          isQuizActive={gameState === 'question'} 
          suspiciousActivityCount={suspiciousActivities.length} 
        />

        {/* Question */}
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center leading-tight">
            {currentQuestion.question}
          </h2>
          
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {currentQuestion.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left font-medium touch-manipulation ${getAnswerClassName(index)}`}
              >
                <span className="text-base sm:text-lg">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 sm:h-3 mb-4">
          <div 
            className="bg-purple-600 h-2 sm:h-3 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / currentQuestion.time_limit) * 100}%` }}
          />
        </div>
        
        <Footer />
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <div className="bg-white rounded-xl p-6 sm:p-8 card-shadow">
          <div className="bounce-in mb-4 sm:mb-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            {lastAnswerCorrect ? 'Correct!' : 'Incorrect!'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Current Score: <strong>{score} points</strong>
          </p>
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-purple-800 text-sm sm:text-base">
              <strong>Streak:</strong> {streak} 🔥
            </p>
          </div>
          
          {/* New Badge Notifications */}
          {newBadges.length > 0 && (
            <div className="mb-6">
              {newBadges.map((badge, index) => (
                <div key={index} className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-2 text-white animate-pulse">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="font-bold">Badge Earned!</p>
                      <p className="text-sm opacity-90">{badge.name}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setNewBadges([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Dismiss notifications
              </button>
            </div>
          )}
          
          {currentQuestion?.explanation && (
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    );
  }

  if (gameState === 'waiting_for_others') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <div className="bg-white rounded-xl p-6 sm:p-8 card-shadow">
          <div className="pulse-animation mb-4 sm:mb-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Quiz Complete!</h2>
          
          {/* Individual Score Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">{score}</div>
            <div className="text-lg text-gray-700">Your Score</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm sm:text-base">
              <strong>Waiting for other participants to finish...</strong>
            </p>
            <p className="text-blue-600 text-xs sm:text-sm mt-2">
              Results will be announced once everyone completes the quiz.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
            <span>Game PIN: <strong>{session.pin}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate max-w-full">Quiz: <strong>{session.quizzes?.title}</strong></span>
          </div>
          
          <button
            onClick={onLeave}
            className="mt-6 btn-secondary flex items-center space-x-2 mx-auto text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Leave Game</span>
          </button>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (gameState === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl p-6 card-shadow mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onLeave}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quiz Complete!</h1>
                  <p className="text-gray-600">Your final score: <strong>{score} points</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Score Card */}
          <div className="bg-white rounded-xl p-8 card-shadow mb-6 text-center">
            <div className="mb-6">
              <div className="h-20 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-gray-600 text-lg">You completed the quiz successfully</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">{score}</div>
              <div className="text-lg text-gray-700">Total Points</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 text-sm font-bold">!</span>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800">Results Will Be Announced Soon</h3>
              </div>
              <p className="text-yellow-700 text-sm">
                The final leaderboard and rankings will be displayed once all participants complete the quiz.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl p-6 card-shadow">
            <div className="flex justify-center space-x-4">
              <button
                onClick={onLeave}
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

  return null;
};