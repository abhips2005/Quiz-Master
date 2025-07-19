import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit3, Trash2, Users, BarChart3, Trophy, Clock } from 'lucide-react';
import { getQuizzes, getQuizById, createGameSession, deleteQuiz } from '../../lib/supabase';
import { Quiz } from '../../types';
import { QuizEditor } from './QuizEditor';
import { GameLobby } from './GameLobby';
import { Footer } from '../Layout/Footer';

interface TeacherDashboardProps {
  userId: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ userId }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [gameLobby, setGameLobby] = useState<any>(null);

  useEffect(() => {
    loadQuizzes();
  }, [userId]);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await getQuizzes(userId);
      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    setSelectedQuiz(null);
    setShowEditor(true);
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    try {
      // Load full quiz data with questions
      const { data: fullQuiz, error } = await getQuizById(quiz.id);
      if (error) throw error;
      setSelectedQuiz(fullQuiz);
      setShowEditor(true);
    } catch (error) {
      console.error('Error loading quiz for editing:', error);
    }
  };

  const handleStartGame = async (quiz: Quiz) => {
    try {
      const settings = {
        show_leaderboard: true,
        allow_powerups: true,
        shuffle_questions: false,
        show_correct_answers: true,
        time_pressure: true,
        bonus_points: true,
      };

      const { data: session, error } = await createGameSession(quiz.id, userId, settings);
      if (error) throw error;
      
      setGameLobby(session);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!confirm(`Are you sure you want to delete "${quiz.title}"?`)) return;
    
    try {
      const { error } = await deleteQuiz(quiz.id, userId);
      if (error) throw error;
      await loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  if (showEditor) {
    return (
      <QuizEditor 
        quiz={selectedQuiz} 
        onSave={() => {
          setShowEditor(false);
          loadQuizzes();
        }}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  if (gameLobby) {
    return (
      <GameLobby 
        session={gameLobby}
        onClose={() => setGameLobby(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage your quizzes</p>
          </div>
          <button
            onClick={handleCreateQuiz}
            className="btn-primary flex items-center space-x-2 justify-center sm:justify-start px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base touch-manipulation"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Quizzes</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{quizzes.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Questions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {quizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Games Played</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Avg. Duration</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">5m</p>
            </div>
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="bg-white rounded-xl card-shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">My Quizzes</h3>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first quiz to get started!</p>
              <button
                onClick={handleCreateQuiz}
                className="btn-primary px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {quiz.difficulty}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleEditQuiz(quiz)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 touch-manipulation"
                      >
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuiz(quiz)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 touch-manipulation"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{quiz.title}</h4>
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">{quiz.description}</p>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4">
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span>{quiz.time_limit}min</span>
                  </div>
                  
                  <button
                    onClick={() => handleStartGame(quiz)}
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-2 text-sm sm:text-base touch-manipulation"
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Start Game</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};
