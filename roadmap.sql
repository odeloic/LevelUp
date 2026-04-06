-- ============================================================
-- CAREER LEVEL-UP ROADMAP — SQLite Schema + Seed Data
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ------------------------------------------------------------
-- SCHEMA
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tracks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  description TEXT,
  color       TEXT    NOT NULL DEFAULT '#6366f1', -- hex
  icon        TEXT    NOT NULL DEFAULT '🗺️',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS phases (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id                INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  slug                    TEXT    NOT NULL UNIQUE,
  title                   TEXT    NOT NULL,
  description             TEXT,
  week_start              INTEGER NOT NULL,
  week_end                INTEGER NOT NULL,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  -- Locked progression: this phase stays locked until the referenced phase is complete
  unlock_requires_phase_id INTEGER REFERENCES phases(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id    INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  author      TEXT,
  type        TEXT    NOT NULL CHECK(type IN ('book','blog','podcast','website','docs','video')),
  url         TEXT,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id       INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title          TEXT    NOT NULL,
  description    TEXT,
  cadence        TEXT    NOT NULL CHECK(cadence IN ('daily','weekly','end_of_phase')),
  is_deliverable INTEGER NOT NULL DEFAULT 0, -- 1 = must complete to unlock next phase
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Completion log — one row per task completion (weekly tasks log per-week, daily per-day)
CREATE TABLE IF NOT EXISTS completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  week_number  INTEGER, -- null for end_of_phase tasks
  day_date     TEXT,    -- ISO date YYYY-MM-DD for daily tasks
  completed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  pr_url       TEXT,    -- GitHub PR or commit URL
  notes        TEXT     -- Markdown — reflections, learnings, links
);

-- App-level user state (single row — app is single-user)
CREATE TABLE IF NOT EXISTS user_state (
  id                  INTEGER PRIMARY KEY CHECK(id = 1),
  current_week        INTEGER NOT NULL DEFAULT 1,
  started_at          TEXT    NOT NULL DEFAULT (date('now')),
  streak_days         INTEGER NOT NULL DEFAULT 0,
  last_active_date    TEXT,
  xp                  INTEGER NOT NULL DEFAULT 0
);

-- XP audit log — one row per XP-earning event
CREATE TABLE IF NOT EXISTS xp_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT    NOT NULL CHECK(event_type IN ('daily','weekly','end_of_phase','deliverable','phase_unlock','streak_7_days')),
  amount      INTEGER NOT NULL,
  task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  phase_id    INTEGER REFERENCES phases(id) ON DELETE SET NULL,
  occurred_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_completions_task  ON completions(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase       ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_phases_track      ON phases(track_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_occurred ON xp_events(occurred_at);

-- ------------------------------------------------------------
-- SEED: TRACKS
-- ------------------------------------------------------------

INSERT INTO tracks (slug, title, description, color, icon, sort_order) VALUES
('job-search',    'Job Search',      'Narrative → Visibility → Targeting → Negotiation. Land the job you deserve.', '#f59e0b', '🎯', 1),
('system-design', 'System Design',   'Formalize your architecture intuition. BE + FE depth.', '#3b82f6', '🏗️', 2),
('ai-engineering','AI Engineering',  'Go beyond demos. Build production AI features with real architecture decisions.', '#8b5cf6', '🤖', 3),
('product',       'Product Thinking','Think in products, not tickets. The rarest skill in engineering.', '#10b981', '📦', 4);

-- ------------------------------------------------------------
-- SEED: PHASES — Job Search Track
-- ------------------------------------------------------------

INSERT INTO phases (track_id, slug, title, description, week_start, week_end, sort_order, unlock_requires_phase_id) VALUES
(1, 'js-narrative',   'Narrative & Positioning', 'Know exactly what you sell and to whom. Reframe your story from tech stack to problem solved.', 1, 3,  1, NULL),
(1, 'js-visibility',  'Visibility',              'Get on the radar of the right people. Consistent public presence, real outreach.', 4, 7,  2, 1),
(1, 'js-targeting',   'Targeting',               'Structured, systematic job search. Work the LAMP list. No spray-and-pray.', 8, 10, 3, 2),
(1, 'js-negotiate',   'Negotiation',             'Don''t leave money or leverage on the table. Scripts, numbers, psychology.', 11, 12, 4, 3);

-- SEED: PHASES — System Design Track
INSERT INTO phases (track_id, slug, title, description, week_start, week_end, sort_order, unlock_requires_phase_id) VALUES
(2, 'sd-fundamentals','Fundamentals',            'Vocabulary and intuition for distributed systems. DDIA as the foundation.', 1, 6,  1, NULL),
(2, 'sd-frontend',    'Frontend System Design',  'Rendering strategies, state architecture, performance budgets. Often ignored — big edge.', 7, 12, 2, 5);

-- SEED: PHASES — AI Engineering Track
INSERT INTO phases (track_id, slug, title, description, week_start, week_end, sort_order, unlock_requires_phase_id) VALUES
(3, 'ai-foundations', 'Foundations',             'Embeddings, RAG, evals, agents. Chip Huyen''s framework as the backbone.', 4, 7,  1, NULL),
(3, 'ai-production',  'Production Patterns',     'Real AI features in real projects. Architecture decisions, not demos.', 8, 12, 2, 7);

-- SEED: PHASES — Product Track
INSERT INTO phases (track_id, slug, title, description, week_start, week_end, sort_order, unlock_requires_phase_id) VALUES
(4, 'prod-scoping',   'Scoping & Discovery',     'Shape work before writing a line of code. Talk to users without fooling yourself.', 7, 9,  1, NULL),
(4, 'prod-shipping',  'Shipping with Ownership', 'Own outcomes, not just outputs. Write one-pagers. Know when something is done.', 10, 12, 2, 9);

-- ------------------------------------------------------------
-- SEED: RESOURCES
-- ------------------------------------------------------------

-- Job Search: Narrative
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(1, 'So Good They Can''t Ignore You', 'Cal Newport',  'book', NULL, 'Shifts you from "follow your passion" to building rare, valuable skills — then leveraging them. Validates what you already have.', 1),
(1, 'Show Your Work',                 'Austin Kleon', 'book', NULL, 'Document and share your process publicly. Short read — high ROI for engineers who ship interesting things.', 2);

-- Job Search: Visibility
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(2, 'The 2-Hour Job Search',  'Steve Dalton',  'book',    NULL,                        'Systematic, non-cringe approach. Treats job searching like engineering: repeatable process.', 1),
(2, 'Developer Hegemony',     'Erik Dietrich', 'book',    NULL,                        'Written specifically for senior devs who feel undervalued. Think like a consultant, not an employee.', 2),
(2, 'How Developers Stop Being Ordinary (daedtech series)', 'Erik Dietrich', 'blog', 'https://daedtech.com', 'Free. Most practical content on developer branding and positioning.', 3);

-- Job Search: Targeting
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(3, 'The 2-Hour Job Search (LAMP chapters)', 'Steve Dalton', 'book', NULL,                 'Revisit the tactical LAMP list chapters. This is the engine.', 1),
(3, 'levels.fyi',                            NULL,           'website', 'https://levels.fyi', 'Know your market rate before any conversation. You cannot negotiate without a number.', 2);

-- Job Search: Negotiation
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(4, 'Never Split the Difference', 'Chris Voss',   'book', NULL, 'Best negotiation book period. Techniques rooted in human psychology — works in salary talks.', 1),
(4, 'Fearless Salary Negotiation', 'Josh Doody',  'book', NULL, 'Built specifically for software engineers. Countering offers, handling recruiters, full cycle.', 2);

-- System Design: Fundamentals
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(5, 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'book', NULL, 'The bible. Not interview prep — actual fundamentals. Read slowly and annotate.', 1),
(5, 'System Design Interview Vol 1',         'Alex Xu',          'book', NULL, 'Structured vocabulary for communicating designs clearly in conversations.', 2),
(5, 'ByteByteGo Newsletter',                 'Alex Xu',          'blog', 'https://bytebytego.com', 'Weekly system design breakdowns — good complement to the book.', 3);

-- System Design: Frontend
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(6, 'Frontend System Design', NULL, 'website', 'https://www.greatfrontend.com/system-design', 'Rendering strategies, state architecture, performance budgets. Most devs skip this — big edge.', 1);

-- AI Engineering: Foundations
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(7, 'AI Engineering',         'Chip Huyen', 'book',    NULL,                                  'Best structured foundation on the full AI stack: embeddings, RAG, evals, agents.', 1),
(7, 'Anthropic API Docs',     NULL,         'docs',    'https://docs.anthropic.com',           'Read them like source code, not tutorials. Pay attention to evals and tool use patterns.', 2),
(7, 'Latent Space Podcast',   NULL,         'podcast', 'https://www.latent.space/podcast',     'Best signal on where AI engineering is actually going.', 3);

-- AI Engineering: Production
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(8, 'OpenAI Cookbook',   NULL, 'docs',    'https://cookbook.openai.com',          'Real patterns for production AI features. RAG, evals, function calling at scale.', 1),
(8, 'Latent Space Podcast (continued)', NULL, 'podcast', 'https://www.latent.space/podcast', 'Keep listening — episode-by-episode beats binge.', 2);

-- Product: Scoping
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(9,  'Shape Up',                    'Ryan Singer / Basecamp', 'book',    'https://basecamp.com/shapeup', 'How to scope and ship product work with autonomy. Changes how you think about estimates.', 1),
(9,  'The Mom Test',                'Rob Fitzpatrick',        'book',    NULL,                           'How to talk to users without fooling yourself. Immediately useful in your client work.', 2);

-- Product: Shipping
INSERT INTO resources (phase_id, title, author, type, url, description, sort_order) VALUES
(10, 'Continuous Discovery Habits', 'Teresa Torres', 'book', NULL, 'Embed user research into your workflow — not a separate phase, a continuous habit.', 1);

-- ------------------------------------------------------------
-- SEED: TASKS
-- ------------------------------------------------------------

-- ── Phase 1: Narrative ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(1, 'Read (20 min)',
   'Read your current phase book. No skimming — take one note per chapter that connects to your own situation.',
   'daily', 0, 1),

(1, 'Write one sentence',
   'Write one sentence about a specific problem you solved at work. Just one. Build the habit.',
   'daily', 0, 2),

(1, 'Rewrite your positioning paragraph',
   'What problem do you solve, for whom, and why are you the right person to solve it? Rewrite it every week until it feels true.',
   'weekly', 0, 3),

(1, 'Finalize positioning paragraph',
   'A clear, honest answer to: "What problem do I solve, for whom, and why me?" — not your job title, not your stack.',
   'end_of_phase', 1, 4),

(1, 'Rewrite LinkedIn headline',
   'Apply your new positioning. Problem-first, not title-first.',
   'end_of_phase', 1, 5);

-- ── Phase 2: Visibility ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(2, 'One LinkedIn action',
   'Comment thoughtfully on a post, or write 3 lines toward your own post. Consistency beats quality at this stage.',
   'daily', 0, 1),

(2, 'Read (20 min)',
   'Read your current phase book. Take one applicable note per session.',
   'daily', 0, 2),

(2, 'Send one genuine outreach',
   'Not "I am looking for a job." A message to someone whose work you respect — a real observation, question, or connection point.',
   'weekly', 0, 3),

(2, 'Advance one public artifact',
   'Blog post draft, GitHub README, case study from a project you shipped. Something you can point to.',
   'weekly', 0, 4),

(2, 'Publish 2 posts',
   'Two public pieces — a LinkedIn post, article, or published blog. Evidence of thinking, not just building.',
   'end_of_phase', 1, 5),

(2, 'Make 5 genuine connections',
   'Not follows — real exchanges. Conversations started, maintained, or moved forward.',
   'end_of_phase', 1, 6),

(2, 'Overhaul LinkedIn profile',
   'Rewrite every section through the lens of your positioning. Profile is a landing page, not a CV.',
   'end_of_phase', 1, 7);

-- ── Phase 3: Targeting ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(3, 'Work the LAMP list (30 min)',
   'Ranked list of 20 target companies. Research, activate connections, advance conversations. Treat it like a pipeline.',
   'daily', 0, 1),

(3, 'Send 3 outreach messages',
   'Warm, specific, goal-driven messages to people in or adjacent to your target companies.',
   'weekly', 0, 2),

(3, 'Follow up on previous week''s outreach',
   'One follow-up per week. Persistence > volume.',
   'weekly', 0, 3),

(3, 'Research market rate on levels.fyi',
   'Know the number for every role you are targeting before any conversation.',
   'weekly', 0, 4),

(3, 'Complete 20-company LAMP list',
   'Ranked, annotated, with connection status for each. Your job search pipeline.',
   'end_of_phase', 1, 5),

(3, 'Have 3+ active conversations',
   'Real dialogues in progress — not just messages sent. Calls, email threads, DMs moving forward.',
   'end_of_phase', 1, 6);

-- ── Phase 4: Negotiate ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(4, 'Read + practice scripts out loud',
   'Read Never Split the Difference or Fearless Salary Negotiation. Then say the scripts out loud. Actually speak them.',
   'daily', 0, 1),

(4, 'Role-play a negotiation scenario',
   'Write it out as a dialogue or find someone to practice with. Cover: counter-offer, lowball, exploding offer.',
   'weekly', 0, 2),

(4, 'Finalize negotiation script',
   'A word-for-word script for the salary negotiation conversation. Practiced, not improvised.',
   'end_of_phase', 1, 3),

(4, 'Define floor / target / stretch numbers',
   'For every role type you are targeting: the number you will not go below, the number you aim for, the number that would surprise you.',
   'end_of_phase', 1, 4);

-- ── Phase 5: System Design Fundamentals ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(5, 'Read DDIA (25 min)',
   'Designing Data-Intensive Applications. Read slowly — take margin notes, not highlights.',
   'daily', 0, 1),

(5, 'Apply one concept in writing',
   'After reading, write 2–3 sentences explaining the concept in your own words. No jargon copy-paste.',
   'daily', 0, 2),

(5, 'Architecture diagram of a past project',
   'Pick a system you have shipped (Typesense plugin, Payload CMS, search engine). Draw its architecture. Then critique it: bottlenecks, SPOFs, scaling limits.',
   'weekly', 0, 3),

(5, 'Document 3 architecture critiques',
   'Three real projects you have built, diagrammed and critiqued. Show your reasoning, not just the diagram.',
   'end_of_phase', 1, 4);

-- ── Phase 6: Frontend System Design ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(6, 'Study one FE system design pattern',
   'GreatFrontend or equivalent. Rendering strategies, state architecture, performance budgets.',
   'daily', 0, 1),

(6, 'Apply pattern to a current project',
   'Map what you studied to something you are building or have built. Where does it fit? Where does it break?',
   'weekly', 0, 2),

(6, 'Produce one FE architecture document',
   'A written design document for a real frontend system — covering data flow, rendering strategy, and state management decisions.',
   'end_of_phase', 1, 3);

-- ── Phase 7: AI Engineering Foundations ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(7, 'Read AI Engineering (25 min)',
   'Chip Huyen''s AI Engineering book. Focus on the conceptual model, not just the code examples.',
   'daily', 0, 1),

(7, 'Read Anthropic or OpenAI docs (15 min)',
   'Read them like source code. Pay attention to evals, tool use, and production patterns.',
   'daily', 0, 2),

(7, 'Add one AI-native feature to a real project',
   'Not a demo — a feature in something you are already building. Document the architecture decision, not just the code.',
   'weekly', 0, 3),

(7, 'Document 2 AI architecture decisions',
   'Two real features you built with AI — written up with: problem, options considered, decision made, tradeoffs accepted.',
   'end_of_phase', 1, 4);

-- ── Phase 8: AI Engineering Production ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(8, 'Listen to one Latent Space episode',
   'One episode per week is enough. Take one insight and write a paragraph on how it applies to your current work.',
   'weekly', 0, 1),

(8, 'Build one production-grade AI component',
   'With evals, error handling, fallbacks. Not a prototype. Something you would put in front of a client.',
   'weekly', 0, 2),

(8, 'Write an AI architecture case study',
   'A full write-up of one AI system you built or designed: the stack, the tradeoffs, what you would do differently.',
   'end_of_phase', 1, 3);

-- ── Phase 9: Product Scoping ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(9, 'Read (20 min)',
   'Shape Up or The Mom Test. One principle per session.',
   'daily', 0, 1),

(9, 'Write a one-pager for an active project',
   'Problem, who has it, how you will know the solution worked. One page. No more.',
   'weekly', 0, 2),

(9, 'Conduct one user conversation',
   'Apply The Mom Test. Record the conversation (with permission) or take structured notes. Surface real problems, not opinions.',
   'weekly', 0, 3),

(9, 'Deliver 2 product one-pagers',
   'Two real project one-pagers — problem, audience, success metric. Evidence of product thinking, not just feature shipping.',
   'end_of_phase', 1, 4);

-- ── Phase 10: Product Shipping ──

INSERT INTO tasks (phase_id, title, description, cadence, is_deliverable, sort_order) VALUES
(10, 'Write a weekly retrospective',
    'What shipped, what did not, why. One paragraph. Honest.',
    'weekly', 0, 1),

(10, 'Define done for one in-progress feature',
    'Write the acceptance criteria before you code. What does "complete" look like — for the user, not for you.',
    'weekly', 0, 2),

(10, 'Produce a shipping retrospective',
    'A written retrospective of one complete feature or project: what you scoped, what changed, what you learned.',
    'end_of_phase', 1, 3);

-- ------------------------------------------------------------
-- SEED: INITIAL USER STATE
-- ------------------------------------------------------------

INSERT OR IGNORE INTO user_state (id, current_week, started_at, streak_days, xp)
VALUES (1, 1, date('now'), 0, 0);
