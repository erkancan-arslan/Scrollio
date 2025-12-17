-- =====================================================
-- Sample Videos for Testing
-- Run this after 001_feed_schema.sql
-- Replace BunnyCDN URLs with your actual video URLs
-- =====================================================

-- Get topic and creator IDs for reference
-- (These are from the seed data in 001_feed_schema.sql)

-- Insert sample videos
INSERT INTO videos (
  title,
  description,
  video_url,
  thumbnail_url,
  duration,
  topic_id,
  creator_id,
  difficulty_level,
  tags,
  is_published,
  moderation_status,
  published_at
) VALUES
  -- Science Videos
  (
    'Why do we dream?',
    'Exploring the fascinating science behind dreams and what happens in our brain while we sleep. #science #psychology #dreams',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-1.mp4', -- Replace with your BunnyCDN URL
    'https://picsum.photos/seed/dream/400/700',
    45,
    (SELECT id FROM topics WHERE slug = 'psychology' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'sciencewithsara' LIMIT 1),
    'beginner',
    ARRAY['science', 'psychology', 'dreams', 'sleep'],
    true,
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    'How black holes form',
    'A quick explanation of how massive stars collapse to form black holes - the most mysterious objects in the universe! ✨🌌',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-2.mp4',
    'https://picsum.photos/seed/blackhole/400/700',
    58,
    (SELECT id FROM topics WHERE slug = 'physics' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'astromax' LIMIT 1),
    'intermediate',
    ARRAY['space', 'astronomy', 'blackholes', 'physics'],
    true,
    'approved',
    NOW() - INTERVAL '2 days'
  ),
  (
    'The power of compound interest',
    'Learn how compound interest can turn small savings into big wealth over time. Start early! 💰📈 #finance #investing',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-3.mp4',
    'https://picsum.photos/seed/finance/400/700',
    42,
    (SELECT id FROM topics WHERE slug = 'finance' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'moneyminute' LIMIT 1),
    'beginner',
    ARRAY['finance', 'investing', 'money', 'savings'],
    true,
    'approved',
    NOW() - INTERVAL '3 days'
  ),
  (
    'JavaScript closures explained',
    'Understanding closures is key to mastering JavaScript. Here''s the simplest explanation! 💻🚀 #coding #javascript #webdev',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-4.mp4',
    'https://picsum.photos/seed/coding/400/700',
    55,
    (SELECT id FROM topics WHERE slug = 'technology' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'codewithjane' LIMIT 1),
    'intermediate',
    ARRAY['coding', 'javascript', 'programming', 'webdev'],
    true,
    'approved',
    NOW() - INTERVAL '4 days'
  ),
  (
    'Why do we yawn?',
    'Is yawning really contagious? The science behind this everyday phenomenon might surprise you! 🥱🧠',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-5.mp4',
    'https://picsum.photos/seed/yawn/400/700',
    38,
    (SELECT id FROM topics WHERE slug = 'biology' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'curiositydaily' LIMIT 1),
    'beginner',
    ARRAY['biology', 'science', 'health', 'curiosity'],
    true,
    'approved',
    NOW() - INTERVAL '5 days'
  ),
  (
    'Ancient Rome in 60 seconds',
    'From a small village to the greatest empire - the rise and fall of Rome condensed! 🏛️⚔️ #history #rome #ancient',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-6.mp4',
    'https://picsum.photos/seed/rome/400/700',
    60,
    (SELECT id FROM topics WHERE slug = 'history' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'historyflash' LIMIT 1),
    'beginner',
    ARRAY['history', 'rome', 'ancient', 'civilization'],
    true,
    'approved',
    NOW() - INTERVAL '6 days'
  ),
  (
    'How to solve any Rubik''s cube',
    'The beginner-friendly method to solve any Rubik''s cube. You CAN learn this! 🧩✨ #puzzle #rubikscube #learn',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-7.mp4',
    'https://picsum.photos/seed/rubik/400/700',
    52,
    (SELECT id FROM topics WHERE slug = 'mathematics' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'mathmagic' LIMIT 1),
    'beginner',
    ARRAY['puzzle', 'rubikscube', 'howto', 'skills'],
    true,
    'approved',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Quantum entanglement simplified',
    'Einstein called it "spooky action at a distance" - here''s what quantum entanglement really means! ⚛️🔮',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-8.mp4',
    'https://picsum.photos/seed/quantum/400/700',
    48,
    (SELECT id FROM topics WHERE slug = 'physics' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'sciencewithsara' LIMIT 1),
    'advanced',
    ARRAY['physics', 'quantum', 'science', 'einstein'],
    true,
    'approved',
    NOW() - INTERVAL '8 days'
  ),
  (
    'The psychology of habits',
    'Why do we form habits? And how can we break bad ones and build good ones? Let''s dive into the science! 🧠💪',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-9.mp4',
    'https://picsum.photos/seed/habits/400/700',
    50,
    (SELECT id FROM topics WHERE slug = 'psychology' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'psych101' LIMIT 1),
    'beginner',
    ARRAY['psychology', 'habits', 'productivity', 'mindset'],
    true,
    'approved',
    NOW() - INTERVAL '9 days'
  ),
  (
    'How AI actually works',
    'Neural networks, machine learning, deep learning - what does it all mean? A simple explanation! 🤖✨',
    'https://vz-cac74041-8b3.b-cdn.net/sample-video-10.mp4',
    'https://picsum.photos/seed/ai/400/700',
    56,
    (SELECT id FROM topics WHERE slug = 'technology' LIMIT 1),
    (SELECT id FROM creators WHERE username = 'codewithjane' LIMIT 1),
    'intermediate',
    ARRAY['ai', 'technology', 'machinelearning', 'future'],
    true,
    'approved',
    NOW() - INTERVAL '10 days'
  );

-- Update video counts for topics and creators
-- (The triggers should handle this, but let's make sure)
UPDATE topics t SET video_count = (
  SELECT COUNT(*) FROM videos v 
  WHERE v.topic_id = t.id AND v.is_published = true AND v.moderation_status = 'approved'
);

UPDATE creators c SET video_count = (
  SELECT COUNT(*) FROM videos v 
  WHERE v.creator_id = c.id AND v.is_published = true AND v.moderation_status = 'approved'
);

-- =====================================================
-- Done! Sample videos inserted.
-- Remember to update the video_url with your actual BunnyCDN URLs
-- =====================================================

