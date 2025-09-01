# 🔧 Database Fix Instructions

## Issue
The `current_question_index` column is missing from the `participants` table, which prevents individual question progression from working correctly.

## Solution
You need to run the SQL script `fix-individual-progress.sql` in your Supabase dashboard.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the **SQL Editor** section

### 2. Run the Fix Script
- Copy the contents of `fix-individual-progress.sql`
- Paste it into the SQL Editor
- Click **Run** to execute the script

### 3. Verify the Fix
After running the script, you should see:
- A confirmation that the column was added
- A query result showing the new column details

### 4. Test the Fix
Run the test script to verify everything is working:
```bash
node test-db-structure.js
```

## What the Fix Does:
1. **Adds `current_question_index` column** to the `participants` table
2. **Creates an index** for better performance
3. **Updates existing participants** to have a default value of 0
4. **Creates a helper function** for getting individual player questions
5. **Grants necessary permissions** to authenticated users

## Expected Result:
After applying this fix:
- ✅ Individual question progression will work
- ✅ Students who finish early will see a waiting screen
- ✅ Single players will complete immediately
- ✅ All participants will see results together
- ✅ Scores will be properly recorded for cumulative leaderboard

## If You Still Have Issues:
1. Check that the SQL script ran successfully
2. Verify the column exists by running the test script
3. Try creating a new quiz session to test the functionality
4. Check the browser console for any JavaScript errors

## Next Steps:
Once the fix is applied, test the waiting mechanism by:
1. Creating a quiz with multiple questions
2. Having multiple students join
3. Having one student complete the quiz early
4. Verifying they see the waiting screen
5. Having other students complete the quiz
6. Verifying all students see the final results together
