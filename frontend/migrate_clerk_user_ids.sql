-- Run once in Supabase SQL Editor (Clerk user IDs are text, not UUID)
-- Fixes: invalid input syntax for type uuid: "user_..."

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE user_profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE user_profiles ADD PRIMARY KEY (id);

-- RLS: Clerk auth does not set auth.uid(); allow API/service-role access patterns
DROP POLICY IF EXISTS "Users can manage their own profiles" ON user_profiles;
CREATE POLICY "Allow profile access" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);
