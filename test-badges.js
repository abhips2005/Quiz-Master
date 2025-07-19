// Test script to check badge functionality
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBadges() {
  console.log('Testing badge system...');
  
  try {
    // 1. Check if badges exist
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*');
    
    console.log('Badges in database:', badges?.length || 0);
    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return;
    }
    
    badges?.forEach(badge => {
      console.log(`- ${badge.name}: ${badge.description}`);
    });
    
    // 2. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return;
    }
    
    console.log('Current user:', user.id);
    
    // 3. Try to award a test badge (First Steps)
    const firstStepsBadge = badges?.find(b => b.name === 'First Steps');
    if (firstStepsBadge) {
      console.log('Attempting to award First Steps badge...');
      
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .insert([{
          user_id: user.id,
          badge_id: firstStepsBadge.id,
          context: 'Test badge awarding',
        }])
        .select()
        .single();
      
      if (achievementError) {
        console.error('Error creating achievement:', achievementError);
      } else {
        console.log('Successfully awarded badge:', achievement);
      }
      
      // 4. Check if user has the badge
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('achievements')
        .select(`
          id,
          context,
          created_at,
          badges (
            name,
            description,
            icon
          )
        `)
        .eq('user_id', user.id);
      
      console.log('User badges:', userBadges?.length || 0);
      userBadges?.forEach(achievement => {
        console.log(`- ${achievement.badges.name}: ${achievement.context}`);
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBadges();
