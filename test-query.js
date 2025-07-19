// Test query to check participant data structure
import { supabase } from './src/lib/supabase.js';

async function testParticipantQuery() {
  console.log('Testing participant query...');
  
  // Get all participants from recent sessions
  const { data, error } = await supabase
    .from('participants')
    .select(`
      *,
      users (
        name
      )
    `)
    .limit(5);
  
  console.log('Query result:', { data, error });
  console.log('First participant:', data?.[0]);
}

testParticipantQuery();
