import React from 'react';
import { Play, Users, Trophy, Zap, Shield, Clock, Star, ArrowRight, CheckCircle, BookOpen, BarChart } from 'lucide-react';
import { Footer } from '../Layout/Footer';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const features = [
    {
      icon: <Play className="h-8 w-8" />,
      title: "Real-Time Quizzes",
      description: "Create and host interactive quizzes with instant feedback and live results."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multi-Player Support",
      description: "Connect unlimited students simultaneously for engaging classroom experiences."
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Achievement System",
      description: "Motivate learners with badges, streaks, and performance tracking."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Anti-Cheating Protection",
      description: "Advanced security measures ensure fair play and academic integrity."
    },
    {
      icon: <BarChart className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Track performance, identify learning gaps, and measure progress instantly."
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Timed Questions",
      description: "Customizable time limits create excitement and test quick thinking."
    }
  ];

  // Launch benefits instead of fake stats
  const benefits = [
    { icon: "🚀", label: "Just Launched" },
    { icon: "✨", label: "Modern Design" },
    { icon: "🔒", label: "Secure Platform" },
    { icon: "📱", label: "Mobile Ready" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Quiz Master Live
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignIn}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="btn-primary px-6 py-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-sm">✨ Fresh Launch - Be Among the First!</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Make Learning
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent block">
                Interactive & Fun
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Create engaging real-time quizzes, boost student participation, and track learning progress with our powerful quiz platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 text-lg font-semibold flex items-center space-x-2 bg-white text-purple-600 hover:bg-gray-50 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <span>Start Creating Quizzes</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/10 px-8 py-4 rounded-lg font-semibold transition-all duration-200"
              >
                Learn More
              </button>
            </div>

            {/* Launch Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl mb-2">{benefit.icon}</div>
                  <div className="text-purple-200 text-sm">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Interactive Learning
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make education engaging, measurable, and fun for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-purple-600 mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">1. Create Your Quiz</h4>
              <p className="text-gray-600">Build engaging questions with multiple choice answers, set time limits, and customize scoring.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">2. Invite Students</h4>
              <p className="text-gray-600">Share a simple game PIN for students to join instantly from any device.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">3. Track & Celebrate</h4>
              <p className="text-gray-600">Monitor real-time results, celebrate achievements, and analyze learning progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon - Community Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join Our Growing Community
            </h3>
            <p className="text-xl text-gray-600 mb-12">
              Be part of the next generation of interactive education
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Fresh Launch - Your Feedback Matters!
                  </h4>
                  <p className="text-gray-600 mb-6">
                    As we're just launching, we'd love to hear from our early adopters. 
                    Your experience will help shape the future of Quiz Master Live.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={onGetStarted}
                      className="btn-primary px-6 py-3"
                    >
                      Be an Early Adopter
                    </button>
                    <a
                      href="mailto:feedback@quizmasterlive.com"
                      className="text-purple-600 hover:text-purple-700 font-medium px-6 py-3 border border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
                    >
                      Share Feedback
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-purple-100 mb-8">
            Join Quiz Master Live today and transform the way you teach and learn with interactive quizzes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-50 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-purple-100">
              <CheckCircle className="h-5 w-5" />
              <span>Free to start • No setup fees</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
