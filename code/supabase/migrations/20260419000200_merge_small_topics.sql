-- Merge small/singleton topics into their parent categories so each topic
-- reaches a healthy video count, and normalize remaining unmapped strings.
-- Target: ≤ 3 beginner and ≤ 3 intermediate per topic.
--
-- Projected result after this migration:
--   Computer Networks  : ~5 beginner, ~3 intermediate  (merged Home Networking, TCP/IP, NAT, OSPF)
--   Discrete Mathematics: ~5 beginner, ~3 intermediate, ~3 advanced  (merged Graph Theory + 3 Turkish verbose)
--   Economics          : ~2 beginner, ~2 intermediate  (Inflation + loose econ strings)
--   Investing          : ~4 advanced, ~3 intermediate  (loose investing strings added)
--   Chess              : unchanged (null difficulty — needs separate curation)
--
-- NOTE: Financial Markets (10 beginner, 5 intermediate) and Personal Finance
-- (5 beginner) are already over the 3+3 limit. Splitting those requires manual
-- curation to pick which videos move to sub-topics.

BEGIN;

-- ── NETWORKING: Merge small sub-topics → Computer Networks ────────────────────
-- Home Networking (1 beginner), TCP/IP (1 intermediate), NAT (1 intermediate),
-- OSPF (1 intermediate) fold into Computer Networks.
UPDATE public.generated_video_jobs
SET topic = 'Computer Networks'
WHERE topic IN ('Home Networking', 'TCP/IP', 'NAT', 'OSPF');

-- ── MATHEMATICS: Graph Theory → Discrete Mathematics ─────────────────────────
-- Graph Theory has only 3 videos (1 per level); folds cleanly into Discrete Math.
UPDATE public.generated_video_jobs
SET topic = 'Discrete Mathematics'
WHERE topic = 'Graph Theory';

-- ── DISCRETE MATHEMATICS: Normalize remaining verbose Turkish strings ──────────
UPDATE public.generated_video_jobs
SET topic = 'Discrete Mathematics'
WHERE topic IN (
  'Ramsey sayılarının hesaplanmasındaki zorluklar, küçük Ramsey sayılarının yapısal ispatları ve bu teorinin büyük veri setlerinde örüntü keşfi ve algoritmik verimlilik açısından pratik önemi.',
  'Sonlu alanların cebirsel yapısı, Galois alanları üzerinde tanımlanan Reed-Solomon kodları gibi ileri hata düzeltme kodlarının inşası, decoding mekanizmaları ve güvenli iletişimde stratejik kullanımı.',
  'Temel modal mantık sistemleri (K, T, S4, S5), erişilebilirlik ilişkileri, Kripke semantiği ve bilgi temsili, yapay zeka çıkarım sistemleri ile dağıtık sistemlerdeki durum geçişlerinin modellenmesinde ileri uygulamaları.'
);

-- ── ECONOMICS: Consolidate loose macroeconomics strings ──────────────────────
-- Creates the "Economics" bucket from Inflation + unmapped econ strings.
UPDATE public.generated_video_jobs
SET topic = 'Economics'
WHERE topic IN (
  'Inflation',
  'The fundamental concept of scarcity and its impact on choices',
  'The underlying economic factors (like demand-pull and cost-push) that cause inflation and its effect on purchasing power and savings.',
  'The mechanism by which central banks influence interest rates and its direct impact on consumer borrowing costs like mortgages and credit cards.'
);

-- ── INVESTING: Add loose investing / markets strings ─────────────────────────
UPDATE public.generated_video_jobs
SET topic = 'Investing'
WHERE topic IN (
  'The counterintuitive nature of diversification – it feels like you''re missing out on the best performer, but protects against catastrophic loss.',
  'The fundamental drivers of stock price movements, including company earnings, market sentiment, and industry trends, and how these create volatility.',
  'The mechanics of bond issuance, interest payments, and maturity, explaining how bonds act as a loan and their role in a balanced portfolio.'
);

-- ── CHESS: Normalize remaining loose chess strings ────────────────────────────
UPDATE public.generated_video_jobs
SET topic = 'Chess'
WHERE topic IN (
  'Understanding how Pawns move, attack, and the special En Passant rule, as well as the concept of pawn promotion.',
  'what is chess, how to play chess'
);

-- ── MISC: Normalize remaining one-off loose strings ──────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Colors'     WHERE topic = 'what are colors';
UPDATE public.generated_video_jobs SET topic = 'History'    WHERE topic = 'what is history';
UPDATE public.generated_video_jobs SET topic = 'Backgammon' WHERE topic = 'tavla nasıl oynanır';

-- ── CASCADE TO generated_videos ───────────────────────────────────────────────
UPDATE public.generated_videos gv
SET    topic      = j.topic,
       updated_at = now()
FROM   public.generated_video_jobs j
WHERE  gv.job_id = j.id
  AND  gv.topic IS DISTINCT FROM j.topic;

-- ── CASCADE TO kids_content ───────────────────────────────────────────────────
UPDATE public.kids_content kc
SET    topic      = gv.topic,
       updated_at = now()
FROM   public.generated_videos gv
WHERE  kc.source_generated_video_id = gv.id
  AND  kc.topic IS DISTINCT FROM gv.topic;

-- ── CASCADE TO videos ─────────────────────────────────────────────────────────
UPDATE public.videos v
SET    topic = gv.topic
FROM   public.generated_videos gv
WHERE  v.source_generated_video_id = gv.id
  AND  v.topic IS DISTINCT FROM gv.topic;

COMMIT;
