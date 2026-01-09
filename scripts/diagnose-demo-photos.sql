-- Diagnostic queries for demo account photo issues
-- Run these in DataGrip or psql

-- 1. Check if source user (b40acd0e-9c94-4b3c-a248-43d3bb21b0f8) has cycle photos
SELECT
    'Source User Cycle Photos' as check_name,
    COUNT(*) as photo_count
FROM photos p
JOIN stage_runs sr ON p.stage_run_id = sr.stage_run_id
JOIN cycles c ON sr.cycle_id = c.cycle_id
WHERE c.user_id = 'b40acd0e-9c94-4b3c-a248-43d3bb21b0f8'
  AND p.is_deleted = false;

-- 2. List all demo accounts with photo counts
SELECT
    u.user_id,
    u.email,
    u.username,
    u.date_created,
    COUNT(DISTINCT i.inventory_id) as inventory_count,
    COUNT(DISTINCT c.cycle_id) as cycle_count,
    COUNT(DISTINCT sr.stage_run_id) as stage_run_count,
    COUNT(DISTINCT p.photo_id) as cycle_photo_count,
    COUNT(DISTINCT ip.inventory_photo_id) as inventory_photo_count
FROM users u
LEFT JOIN inventory i ON u.user_id = i.user_id AND i.is_deleted = false
LEFT JOIN cycles c ON u.user_id = c.user_id
LEFT JOIN stage_runs sr ON c.cycle_id = sr.cycle_id
LEFT JOIN photos p ON sr.stage_run_id = p.stage_run_id AND p.is_deleted = false
LEFT JOIN inventory_photos ip ON i.inventory_id = ip.inventory_id
WHERE u.is_demo_account = true
GROUP BY u.user_id, u.email, u.username, u.date_created
ORDER BY u.date_created DESC;

-- 3. Check the most recent demo account details
WITH latest_demo AS (
    SELECT user_id
    FROM users
    WHERE is_demo_account = true
    ORDER BY date_created DESC
    LIMIT 1
)
SELECT
    'Latest Demo Account' as check_name,
    u.user_id,
    u.email,
    u.date_created as account_created,
    (SELECT COUNT(*) FROM cycles WHERE user_id = u.user_id) as cycle_count,
    (SELECT COUNT(*) FROM stage_runs sr
     JOIN cycles c ON sr.cycle_id = c.cycle_id
     WHERE c.user_id = u.user_id) as stage_run_count,
    (SELECT COUNT(*) FROM photos p
     JOIN stage_runs sr ON p.stage_run_id = sr.stage_run_id
     JOIN cycles c ON sr.cycle_id = c.cycle_id
     WHERE c.user_id = u.user_id AND p.is_deleted = false) as cycle_photo_count
FROM users u
WHERE u.user_id = (SELECT user_id FROM latest_demo);

-- 4. Check Hangfire job status (if jobs table exists)
-- Look for recent photo copy jobs
SELECT
    id,
    invocationdata::json->>'Type' as job_type,
    invocationdata::json->>'Method' as method,
    createdat,
    statename,
    statedata,
    expireat
FROM hangfire.job
WHERE invocationdata::text LIKE '%CopyPhotosForDemoAccountAsync%'
ORDER BY createdat DESC
LIMIT 10;
