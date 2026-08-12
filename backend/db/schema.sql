-- ============================================================
-- School ERP — Cross-Module Reporting
-- Schema covering three modules that the reporting layer joins:
--   1. Academics (students, exams, exam_results)
--   2. Attendance (attendance)
--   3. Finance   (fee_structure, fee_payments)
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  roll_no        TEXT UNIQUE NOT NULL,
  class          TEXT NOT NULL,
  section        TEXT NOT NULL,
  admission_date TEXT NOT NULL,
  guardian_name  TEXT,
  contact        TEXT
);

CREATE TABLE IF NOT EXISTS fee_structure (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  class    TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  term     TEXT NOT NULL,
  amount   REAL NOT NULL,
  due_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_type      TEXT NOT NULL,
  term          TEXT NOT NULL,
  amount_due    REAL NOT NULL,
  amount_paid   REAL NOT NULL DEFAULT 0,
  payment_date  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' -- paid | partial | pending | overdue
);

CREATE TABLE IF NOT EXISTS attendance (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  status     TEXT NOT NULL, -- present | absent | late | excused
  term       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  class     TEXT NOT NULL,
  term      TEXT NOT NULL,
  exam_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_results (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id        INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject        TEXT NOT NULL,
  marks_obtained REAL NOT NULL,
  max_marks      REAL NOT NULL DEFAULT 100
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_term ON attendance(term);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class, section);
