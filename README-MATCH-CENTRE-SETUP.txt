OJ SAMUEL — MATCH CENTRE & AUTOMATIC eFOOTBALL LEADERBOARD

WHAT THIS UPGRADE ADDS
- Admin Match Centre tab.
- Create fixtures using approved player registrations.
- Enter match scores.
- Submit scores for approval; only approved scores count.
- Approve or reject submitted results.
- Automatic public standings: played, wins, draws, losses, goals for/against, goal difference and points.
- Public fixture/results section on the existing website.

SCORING RULES
- Win: 3 points
- Draw: 1 point
- Loss: 0 points
- Tie-break order: points, goal difference, goals scored, head-to-head points.
- The standings view recalculates from approved match rows whenever it is queried.

FILES TO PUT IN THE ROOT OF YOUR EXISTING GITHUB REPOSITORY
1. index.html                 Replace the existing public index.html with this upgraded file.
2. admin.html                 Replace the existing admin.html with this upgraded file.
3. oj-match-center.js         Add this new file beside index.html and admin.html.
4. supabase-config.js         Keep your existing file, but make sure it contains your real Project URL and anon/publishable key.

DATABASE SETUP
1. Open your Supabase project → SQL Editor.
2. Make sure your existing registrations setup and the CMS setup have already been run. The CMS setup creates public.is_oj_admin(), which protects match administration.
3. Run the complete file oj-tournament-engine.sql.
4. Confirm your signed-in admin's Auth user UUID is present in public.admin_users (from your earlier CMS setup). Do not add a service_role key to any website file.
5. In Supabase → Authentication, make sure you can sign in with your admin email/password.

SUPABASE CONFIGURATION
The supabase-config.js file in this package is still a template because project credentials are private and were not supplied in this chat. Replace:
- PASTE_SUPABASE_PROJECT_URL_HERE with your Supabase Project URL.
- PASTE_SUPABASE_ANON_KEY_HERE with your Supabase anon/public key.
Never use the service_role/secret key in browser code.

TESTING
1. Open the public site. Existing page design remains in place; the new Match Centre appears near the bottom.
2. Open /admin.html and sign in.
3. Open Registrations and approve at least two eFootball players.
4. Open Match Centre and create a fixture between those two approved players.
5. Enter the score after the match. It becomes Pending Approval.
6. Approve the result. Refresh the public site; the leaderboard should show the updated points and stats.

IMPORTANT
- This is an administrator-entered match result workflow. It does not read scores directly from eFootball or verify screenshots automatically.
- Only approved results affect the leaderboard.
- Player registration rows are not modified by this upgrade.
- If the SQL Editor reports that public.is_oj_admin() does not exist, run your earlier supabase-cms-setup.sql first, then rerun oj-tournament-engine.sql.
- If your registrations table uses a non-UUID id column, tell me the exact error from Supabase so I can adjust the optional registration ID fields. Player names and gamer tags are also stored directly on each fixture.
