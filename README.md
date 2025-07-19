# Live Quiz Platform with Gamification

A modern, real-time quiz platform built with React, TypeScript, Tailwind CSS, and Supabase. Features comprehensive gamification elements including points, streaks, badges, and leaderboards.

## Features

### For Teachers
- **Quiz Management**: Create, edit, and manage quizzes with multiple question types
- **Live Game Sessions**: Start real-time quiz sessions with auto-generated PINs
- **Real-time Monitoring**: Track participants joining and monitor game progress
- **Customizable Settings**: Configure game rules, time limits, and scoring

### For Students
- **Easy Joining**: Join games using simple PIN codes
- **Real-time Gameplay**: Participate in live quizzes with instant feedback
- **Gamification**: Earn points, maintain streaks, unlock badges, and climb leaderboards
- **Responsive Design**: Play on any device with optimized mobile experience

### Gamification Elements
- **Points System**: Earn points based on correctness and speed
- **Streak Tracking**: Build and maintain answer streaks for bonus points
- **Achievement Badges**: Unlock 8 different badge types (Common to Legendary)
- **Leaderboards**: Compete with other students globally and per session
- **Level Progression**: Advance through levels based on total points earned

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Authentication)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd live-quiz-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Get your Supabase credentials**
   
   Go to your [Supabase Dashboard](https://supabase.com/dashboard):
   - Select your project
   - Go to Settings > API
   - Copy the "Project URL" and "anon public" key
   - Paste them into your `.env` file

5. **Set up the database**
   
   The database schema will be automatically created when you first run the application. The migration file is located at `supabase/migrations/create_quiz_platform_schema.sql`.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:5173` to see the application.

### First Time Setup

1. **Create a teacher account**
   - Click "Create Account" 
   - Fill in your details
   - Select "Teacher" as your role
   - Sign up

2. **Create your first quiz**
   - Click "Create Quiz" on the teacher dashboard
   - Add questions with multiple choice answers
   - Set difficulty, time limits, and point values
   - Save your quiz

3. **Start a live session**
   - Click "Start Game" on any quiz
   - Share the generated PIN with students
   - Monitor participants joining in real-time
   - Start the game when ready

4. **Students can join**
   - Students go to the same URL
   - Create a student account or join as guest
   - Enter the PIN provided by the teacher
   - Choose a nickname and join the game

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Yes |

## Database Schema

The application uses the following main tables:
- `users` - User profiles and gamification stats
- `quizzes` - Quiz definitions and metadata
- `questions` - Individual quiz questions and answers
- `game_sessions` - Live quiz sessions with PINs
- `participants` - Students who joined game sessions
- `answers` - Student responses to questions
- `badges` - Available achievement badges
- `achievements` - User-earned badges

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

The application is configured for easy deployment to Netlify:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard
4. Enable automatic deployments from your Git repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.