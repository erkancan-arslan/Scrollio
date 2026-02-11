-- Seed kids_topics with educational categories
-- This provides the initial set of topics for children to choose from

INSERT INTO public.kids_topics (name, icon_url, category, is_active) VALUES
  ('Dinosaurs', '/icons/dinosaur.svg', 'Science', true),
  ('Space', '/icons/space.svg', 'Science', true),
  ('Animals', '/icons/animals.svg', 'Science', true),
  ('Ocean Life', '/icons/ocean.svg', 'Science', true),
  ('Human Body', '/icons/body.svg', 'Science', true),
  ('Math Basics', '/icons/math.svg', 'Math', true),
  ('Geometry', '/icons/geometry.svg', 'Math', true),
  ('Counting', '/icons/counting.svg', 'Math', true),
  ('World History', '/icons/history.svg', 'History', true),
  ('Ancient Egypt', '/icons/egypt.svg', 'History', true),
  ('Geography', '/icons/globe.svg', 'Geography', true),
  ('Countries', '/icons/flags.svg', 'Geography', true),
  ('Art & Music', '/icons/art.svg', 'Arts', true),
  ('Coding Basics', '/icons/code.svg', 'Technology', true),
  ('Robots', '/icons/robot.svg', 'Technology', true),
  ('Languages', '/icons/languages.svg', 'Languages', true),
  ('Stories & Myths', '/icons/book.svg', 'Literature', true),
  ('Healthy Habits', '/icons/health.svg', 'Health', true),
  ('Sports', '/icons/sports.svg', 'Sports', true),
  ('Nature', '/icons/nature.svg', 'Nature', true),
  ('Weather', '/icons/weather.svg', 'Science', true),
  ('Inventions', '/icons/inventions.svg', 'Technology', true),
  ('Music Theory', '/icons/music.svg', 'Arts', true),
  ('Cooking', '/icons/cooking.svg', 'Life Skills', true)
ON CONFLICT (name) DO NOTHING;
