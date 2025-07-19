import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Timer, HelpCircle } from 'lucide-react';
import { createQuiz, supabase } from '../../lib/supabase';
import { Quiz, Question } from '../../types';

interface QuizEditorProps {
  quiz: Quiz | null;
  onSave: () => void;
  onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, onSave, onCancel }) => {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [category, setCategory] = useState(quiz?.category || 'General');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(quiz?.difficulty || 'medium');
  const [timeLimit, setTimeLimit] = useState(quiz?.time_limit || 30);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Load questions when quiz prop changes
  useEffect(() => {
    if (quiz?.questions) {
      // Sort questions by order_index to ensure correct order
      const sortedQuestions = [...quiz.questions].sort((a, b) => a.order_index - b.order_index);
      setQuestions(sortedQuestions);
    } else {
      setQuestions([]);
    }
  }, [quiz]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      quiz_id: quiz?.id || '',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 100,
      time_limit: 30,
      order_index: questions.length,
      type: 'multiple_choice',
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSave = async () => {
    if (!title.trim() || questions.length === 0) {
      alert('Please provide a title and at least one question');
      return;
    }

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No user found');

      const quizData = {
        title,
        description,
        category,
        difficulty,
        time_limit: timeLimit,
        teacher_id: user.data.user.id,
        is_active: true,
      };

      let quizId;
      if (quiz) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quiz.id);
        if (quizError) throw quizError;
        quizId = quiz.id;
      } else {
        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from('quizzes')
          .insert([quizData])
          .select()
          .single();
        if (quizError) throw quizError;
        quizId = newQuiz.id;
      }

      // Delete existing questions if updating
      if (quiz) {
        const { data: existingQuestions } = await supabase
          .from('questions')
          .select('id')
          .eq('quiz_id', quiz.id);
        
        if (existingQuestions && existingQuestions.length > 0) {
          const { error: deleteError } = await supabase
            .from('questions')
            .delete()
            .eq('quiz_id', quiz.id);
          if (deleteError) {
            console.warn('Error deleting existing questions:', deleteError);
            // Continue anyway - might be due to no existing questions
          }
        }
      }

      // Insert questions
      const questionsData = questions.map((q, index) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        time_limit: q.time_limit,
        order_index: index,
        type: q.type,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData);
      if (questionsError) throw questionsError;

      onSave();
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            {quiz ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
        </div>

        {/* Quiz Details */}
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Math">Math</option>
                <option value="Literature">Literature</option>
                <option value="Geography">Geography</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                className="input-field"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                className="input-field"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                min="1"
                max="120"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Questions</h3>
            <button
              onClick={addQuestion}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h4>
              <p className="text-gray-600 mb-6">Add your first question to get started!</p>
              <button
                onClick={addQuestion}
                className="btn-primary"
              >
                Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Question {index + 1}</h4>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={question.points}
                        onChange={(e) => updateQuestion(index, 'points', Number(e.target.value))}
                        min="10"
                        max="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (seconds)
                      </label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          className="input-field pl-10"
                          value={question.time_limit}
                          onChange={(e) => updateQuestion(index, 'time_limit', Number(e.target.value))}
                          min="5"
                          max="120"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <textarea
                      className="input-field resize-none"
                      rows={3}
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correct_answer === optionIndex}
                            onChange={() => updateQuestion(index, 'correct_answer', optionIndex)}
                            className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              className="input-field"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (optional)
                    </label>
                    <textarea
                      className="input-field resize-none"
                      rows={2}
                      value={question.explanation}
                      onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                      placeholder="Explain why this is the correct answer..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim() || questions.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Quiz'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};