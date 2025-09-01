# Weekly Quiz Competition System Setup Guide

This guide explains how to set up and use the new weekly quiz competition system that tracks cumulative scores across 12-13 weeks.

## 🚀 Features

- **12-Week Competition**: Pre-configured weekly competitions with dates
- **Cumulative Scoring**: Total points across all weeks determine overall ranking
- **Weekly Rankings**: Individual week performance tracking
- **Automatic Score Recording**: Scores are automatically recorded when games end
- **Real-time Leaderboards**: Both cumulative and weekly leaderboards
- **Progress Tracking**: Visual timeline of competition progress

## 📋 Database Setup

### 1. Apply the Migration

Run the new migration file to create the required tables:

```sql
-- File: supabase/migrations/20250721000000_add_weekly_competition_system.sql
```

This migration creates:
- `weekly_competitions` - Weekly competition definitions
- `weekly_scores` - Individual weekly scores for each user
- `cumulative_scores` - Total scores across all weeks
- Database functions for leaderboards and rankings
- Automatic triggers for score updates

### 2. Verify Setup

Run the test script to verify everything is working:

```bash
cd Quiz-Master
node test-weekly-system.js
```

Make sure to set your Supabase environment variables first.

## 🎯 How It Works

### Weekly Competitions
- Each week has a start and end date
- Only one competition is active at a time
- Users can participate in multiple quizzes during a week
- Best score for the week is recorded

### Score Recording
- When a game session ends, scores are automatically recorded
- Only registered users (with user_id) have scores recorded
- Anonymous participants are not tracked for competitions
- Scores are linked to specific game sessions

### Cumulative Scoring
- Total points from all weeks determine overall ranking
- Users can see their progress across the entire competition
- Best weekly score and average are tracked
- Number of weeks participated is recorded

## 🏆 Leaderboards

### Cumulative Leaderboard
- Shows overall standings across all weeks
- Displays total score, weeks participated, best score, and average
- Top performers get special recognition (🏆 Champion, 🥈 Runner-up, 🥉 Third Place)

### Weekly Leaderboard
- Shows results for individual weeks
- Users can switch between different weeks
- Current week is highlighted
- Weekly rankings are calculated automatically

## 🎮 User Experience

### For Students
1. **Dashboard**: Access competition dashboard from student dashboard
2. **View Standings**: See both cumulative and weekly rankings
3. **Track Progress**: Monitor performance across weeks
4. **Compete**: Participate in weekly quizzes to earn points

### For Teachers
1. **Create Quizzes**: Design different quizzes for each week
2. **Monitor Progress**: Track student participation and performance
3. **View Results**: See how students perform week by week

## 📱 Components

### CompetitionDashboard
- Main interface for the competition system
- Toggle between cumulative and weekly views
- Competition timeline and progress indicators
- Current week information

### CumulativeLeaderboard
- Overall standings across all weeks
- Detailed user statistics
- Competition progress overview

### WeeklyLeaderboard
- Week-by-week results
- Week selector with current week highlighting
- Individual week performance

## 🔧 Configuration

### Competition Dates
Default competition dates are set in the migration. You can modify them by updating the `weekly_competitions` table:

```sql
UPDATE weekly_competitions 
SET start_date = '2025-01-08', end_date = '2026-01-03'
WHERE week_number = 1;
```

### Adding More Weeks
To extend beyond 12 weeks, add new competitions:

```sql
INSERT INTO weekly_competitions (week_number, title, start_date, end_date) VALUES
(13, 'Week 13 - Extended Challenge', '2024-03-25', '2024-03-31');
```

## 🚨 Important Notes

### Score Recording
- Scores are only recorded for completed game sessions
- Users must be logged in (have a user_id) to be tracked
- Anonymous participants won't appear in competition results

### Data Integrity
- Weekly rankings are recalculated automatically when scores change
- Cumulative scores are updated via database triggers
- Duplicate scores for the same user/week/session are prevented

### Performance
- Leaderboards are limited to prevent performance issues
- Default limits: Cumulative (25 entries), Weekly (15 entries)
- Database indexes are created for optimal query performance

## 🐛 Troubleshooting

### Common Issues

1. **Scores not recording**
   - Check if there's an active weekly competition
   - Verify game sessions are marked as 'completed'
   - Ensure users are logged in (not anonymous)

2. **Leaderboards not loading**
   - Check database connection
   - Verify migration was applied successfully
   - Check browser console for errors

3. **Dates not matching**
   - Update competition dates in the database
   - Ensure current date falls within a competition period

### Debug Commands

Check current week:
```sql
SELECT * FROM weekly_competitions 
WHERE CURRENT_DATE BETWEEN start_date AND end_date;
```

Check user scores:
```sql
SELECT * FROM weekly_scores 
WHERE user_id = 'your-user-id';
```

Check cumulative scores:
```sql
SELECT * FROM cumulative_scores 
ORDER BY total_cumulative_score DESC;
```

## 🔮 Future Enhancements

Potential improvements for the system:
- Email notifications for weekly results
- Achievement badges for competition milestones
- Team competitions
- Custom competition themes
- Export functionality for results
- Mobile app integration

## 📞 Support

If you encounter issues:
1. Check the test script output
2. Verify database migration was applied
3. Check browser console for errors
4. Ensure all environment variables are set correctly

---

**Happy Quizzing! 🎉**
