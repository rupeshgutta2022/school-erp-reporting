// Seeds the database with a realistic, internally-consistent dataset.
// Correlations are deliberately baked in (e.g. students in the "struggling"
// archetype get lower attendance AND lower marks AND more fee delays) so the
// cross-module report has genuine patterns to surface — not just noise.

const db = require('./database');

const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Ishaan','Kabir','Reyansh','Arjun','Sai','Krishna','Rohan',
  'Ananya','Diya','Saanvi','Aadhya','Myra','Kiara','Anika','Riya','Ira','Navya',
  'Mohammed','Yusuf','Zoya','Fatima','Aisha','Omar','Rahul','Priya','Sneha','Karan'];
const LAST_NAMES = ['Sharma','Verma','Iyer','Reddy','Nair','Gupta','Kapoor','Mehta','Rao','Singh',
  'Khan','Joshi','Chatterjee','Bhatt','Pillai','Desai','Malhotra','Kulkarni','Menon','Das'];

const CLASSES = ['6', '7', '8', '9', '10'];
const SECTIONS = ['A', 'B'];
const TERM = 'Term 1 (2026)';
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Second Language'];

// Archetypes shape correlated behaviour across all three modules.
// weight = relative frequency in the population.
const ARCHETYPES = [
  { name: 'strong',      weight: 0.30, attendanceRate: 0.96, marksRange: [78, 97], payDelayChance: 0.05 },
  { name: 'steady',      weight: 0.35, attendanceRate: 0.90, marksRange: [62, 82], payDelayChance: 0.15 },
  { name: 'inconsistent',weight: 0.20, attendanceRate: 0.78, marksRange: [45, 68], payDelayChance: 0.40 },
  { name: 'struggling',  weight: 0.15, attendanceRate: 0.58, marksRange: [22, 50], payDelayChance: 0.70 },
];

function pickArchetype() {
  const r = Math.random();
  let cumulative = 0;
  for (const a of ARCHETYPES) {
    cumulative += a.weight;
    if (r <= cumulative) return a;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(startStr, endStr) {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  return new Date(start + Math.random() * (end - start));
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function seed() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM students').get();
  if (existing.c > 0) {
    console.log(`Database already has ${existing.c} students — skipping seed. Delete school_erp.sqlite to reseed.`);
    return;
  }

  console.log('Seeding database...');

  const insertStudent = db.prepare(`
    INSERT INTO students (name, roll_no, class, section, admission_date, guardian_name, contact)
    VALUES (@name, @roll_no, @class, @section, @admission_date, @guardian_name, @contact)
  `);
  const insertFeeStructure = db.prepare(`
    INSERT INTO fee_structure (class, fee_type, term, amount, due_date)
    VALUES (@class, @fee_type, @term, @amount, @due_date)
  `);
  const insertFeePayment = db.prepare(`
    INSERT INTO fee_payments (student_id, fee_type, term, amount_due, amount_paid, payment_date, status)
    VALUES (@student_id, @fee_type, @term, @amount_due, @amount_paid, @payment_date, @status)
  `);
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (student_id, date, status, term)
    VALUES (@student_id, @date, @status, @term)
  `);
  const insertExam = db.prepare(`
    INSERT INTO exams (name, class, term, exam_date)
    VALUES (@name, @class, @term, @exam_date)
  `);
  const insertResult = db.prepare(`
    INSERT INTO exam_results (student_id, exam_id, subject, marks_obtained, max_marks)
    VALUES (@student_id, @exam_id, @subject, @marks_obtained, @max_marks)
  `);

  // --- Fee structure per class ---------------------------------------
  const FEE_TYPES = [
    { type: 'Tuition Fee', amount: 18000 },
    { type: 'Lab Fee', amount: 2500 },
    { type: 'Library Fee', amount: 1000 },
    { type: 'Transport Fee', amount: 6000 },
  ];
  const feeStructureId = { };
  for (const cls of CLASSES) {
    for (const f of FEE_TYPES) {
      insertFeeStructure.run({
        class: cls, fee_type: f.type, term: TERM,
        amount: f.amount, due_date: '2026-07-15',
      });
    }
    feeStructureId[cls] = FEE_TYPES;
  }

  // --- Exams per class --------------------------------------------------
  const examIdByClass = {};
  for (const cls of CLASSES) {
    const info = insertExam.run({
      name: `${TERM} Unit Test`, class: cls, term: TERM, exam_date: '2026-08-10',
    });
    examIdByClass[cls] = info.lastInsertRowid;
  }

  // --- Attendance calendar: weekdays only, Jun 1 – Aug 28 2026 -----------
  const attendanceDates = [];
  let cursor = new Date('2026-06-01');
  const end = new Date('2026-08-28');
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) attendanceDates.push(fmtDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // --- Students + correlated records -------------------------------------
  let rollCounter = 1001;
  const usedNames = new Set();

  for (const cls of CLASSES) {
    for (const section of SECTIONS) {
      const classSize = randInt(16, 20);
      for (let i = 0; i < classSize; i++) {
        let full;
        do {
          full = `${FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randInt(0, LAST_NAMES.length - 1)]}`;
        } while (usedNames.has(full + cls + section));
        usedNames.add(full + cls + section);

        const archetype = pickArchetype();
        const rollNo = `R${rollCounter++}`;

        const studentInfo = insertStudent.run({
          name: full,
          roll_no: rollNo,
          class: cls,
          section: section,
          admission_date: '2024-06-01',
          guardian_name: `${LAST_NAMES[randInt(0, LAST_NAMES.length - 1)]} Family`,
          contact: `9${randInt(100000000, 999999999)}`,
        });
        const studentId = studentInfo.lastInsertRowid;

        // --- Attendance ---
        for (const date of attendanceDates) {
          const roll = Math.random();
          let status;
          if (roll < archetype.attendanceRate) status = 'present';
          else if (roll < archetype.attendanceRate + 0.03) status = 'late';
          else if (roll < archetype.attendanceRate + 0.05) status = 'excused';
          else status = 'absent';
          insertAttendance.run({ student_id: studentId, date, status, term: TERM });
        }

        // --- Fee payments ---
        for (const f of FEE_TYPES) {
          const delayed = Math.random() < archetype.payDelayChance;
          let status, amountPaid, paymentDate;
          if (!delayed) {
            status = 'paid';
            amountPaid = f.amount;
            paymentDate = fmtDate(randomDateBetween('2026-06-01', '2026-07-14'));
          } else {
            const partialRoll = Math.random();
            if (partialRoll < 0.4) {
              status = 'overdue';
              amountPaid = 0;
              paymentDate = null;
            } else if (partialRoll < 0.75) {
              status = 'partial';
              amountPaid = Math.round(f.amount * (0.3 + Math.random() * 0.4));
              paymentDate = fmtDate(randomDateBetween('2026-07-16', '2026-08-20'));
            } else {
              status = 'paid';
              amountPaid = f.amount;
              paymentDate = fmtDate(randomDateBetween('2026-07-16', '2026-08-25'));
            }
          }
          insertFeePayment.run({
            student_id: studentId, fee_type: f.type, term: TERM,
            amount_due: f.amount, amount_paid: amountPaid,
            payment_date: paymentDate, status,
          });
        }

        // --- Exam results ---
        const examId = examIdByClass[cls];
        for (const subject of SUBJECTS) {
          const [lo, hi] = archetype.marksRange;
          const marks = Math.max(5, Math.min(100, randInt(lo, hi) + randInt(-6, 6)));
          insertResult.run({
            student_id: studentId, exam_id: examId, subject,
            marks_obtained: marks, max_marks: 100,
          });
        }
      }
    }
  }

  const totalStudents = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  console.log(`Seed complete: ${totalStudents} students across ${CLASSES.length} classes.`);
}

seed();
