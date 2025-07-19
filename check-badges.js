// Simple script to check badge data in database
import { supabase } from './src/lib/supabase.js';

console.log('Checking database for badges...');

// Check badges
supabase
  .from('badges')
  .select('*')
  .then(({ data, error }) => {
    console.log('Badges query result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data) {
      console.log('Number of badges:', data.length);
      data.forEach(badge => {
        console.log(`- ${badge.name}: ${badge.description} (ID: ${badge.id})`);
      });
    }
  });

// Check achievements
setTimeout(() => {
  supabase
    .from('achievements')
    .select('*')
    .then(({ data, error }) => {
      console.log('\nAchievements query result:');
      console.log('Data:', data);
      console.log('Error:', error);
      
      if (data) {
        console.log('Number of achievements:', data.length);
      }
    });
}, 1000);
