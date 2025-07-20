import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../../lib/supabase';
import { User, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { Footer } from '../Layout/Footer';

interface AuthFormProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, initialMode = 'login', onBack }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        const { data, error } = await signUpWithEmail(email, password, name, role);
        if (error) throw error;
        console.log('User created with role:', role, 'User metadata:', data.user?.user_metadata);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white hover:text-purple-100 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </button>
          )}
          
          <div className="text-center">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {isLogin ? 'Welcome Back to Quiz Master Live!' : 'Join Quiz Master Live!'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-purple-100">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Create an account to get started'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    className="input-field pl-10 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field pl-10 text-sm sm:text-base py-2 sm:py-3"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  className="input-field pl-10 text-sm sm:text-base py-2 sm:py-3"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="role" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  I am a...
                </label>
                <select
                  id="role"
                  className="input-field text-sm sm:text-base py-2 sm:py-3"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center py-2 sm:py-3 text-sm sm:text-base"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};