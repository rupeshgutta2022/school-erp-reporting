const express = require('express');
const router = express.Router();
const db = require('../db/database');
const riskEngine = require('../lib/riskEngine');

// Builds one cross-module row per student: attendance %, fee status
// breakdown, academic average, and a combined risk score.
function buildCrossModuleRows({ cls, section, term }) {
  let studentQuery = 'SELECT * FROM students WHERE 1=1';
  const params = [];
  if (cls) { studentQuery += ' AND class = ?'; params.push(cls); }
  if (section) { studentQuery += ' AND section = ?'; params.push(section); }
  studentQuery += ' ORDER BY class, section, name';
  const students = db.prepare(studentQuery).all(...params);

  const attendanceStmt = db.prepare(`
    SELECT
      COUNT(*) AS total_days,
      SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) AS present_days
    FROM attendance
    WHERE student_id = ? AND (? IS NULL OR term = ?)
  `);
  const feeStmt = db.prepare(`
    SELECT status, COUNT(*) AS count, SUM(amount_due) AS due, SUM(amount_paid) AS paid
    FROM fee_payments
    WHERE student_id = ? AND (? IS NULL OR term = ?)
    GROUP BY status
  `);
  const marksStmt = db.prepare(`
    SELECT AVG(100.0 * er.marks_obtained / er.max_marks) AS avg_pct
    FROM exam_results er
    JOIN exams e ON e.id = er.exam_id
    WHERE er.student_id = ? AND (? IS NULL OR e.term = ?)
  `);

  return students.map((student) => {
    const att = attendanceStmt.get(student.id, term || null, term || null);
    const attendancePct = att.total_days > 0
      ? Math.round((att.present_days / att.total_days) * 1000) / 10
      : null;

    const feeRows = feeStmt.all(student.id, term || null, term || null);
    const feeSummary = { paid: 0, partial: 0, pending: 0, overdue: 0 };
    let totalDue = 0, totalPaid = 0;
    for (const row of feeRows) {
      feeSummary[row.status] = row.count;
      totalDue += row.due || 0;
      totalPaid += row.paid || 0;
    }

    const marksRow = marksStmt.get(student.id, term || null, term || null);
    const avgMarks = marksRow.avg_pct !== null ? Math.round(marksRow.avg_pct * 10) / 10 : null;

    const risk = (attendancePct !== null && avgMarks !== null)
      ? riskEngine.combine(attendancePct, feeSummary, avgMarks)
      : null;

    return {
      student: {
        id: student.id, name: student.name, roll_no: student.roll_no,
        class: student.class, section: student.section,
      },
      attendance_pct: attendancePct,
      fee_summary: feeSummary,
      fee_due_total: totalDue,
      fee_paid_total: totalPaid,
      fee_collection_pct: totalDue > 0 ? Math.round((totalPaid / totalDue) * 1000) / 10 : null,
      avg_academic_pct: avgMarks,
      risk,
    };
  });
}

// GET /api/reports/cross-module?class=&section=&term=
router.get('/cross-module', (req, res) => {
  const { class: cls, section, term } = req.query;
  res.json(buildCrossModuleRows({ cls, section, term }));
});

// GET /api/reports/cross-module/:studentId — full detail for one student
router.get('/cross-module/:studentId', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const rows = buildCrossModuleRows({ cls: student.class, section: student.section, term: req.query.term });
  const summary = rows.find(r => r.student.id === student.id);

  const attendanceHistory = db.prepare('SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date').all(student.id);
  const feePayments = db.prepare('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY fee_type').all(student.id);
  const examResults = db.prepare(`
    SELECT er.subject, er.marks_obtained, er.max_marks, e.name AS exam_name, e.term
    FROM exam_results er JOIN exams e ON e.id = er.exam_id
    WHERE er.student_id = ? ORDER BY er.subject
  `).all(student.id);

  res.json({ ...summary, attendance_history: attendanceHistory, fee_payments: feePayments, exam_results: examResults });
});

// GET /api/reports/at-risk?class=&term=&level=high
router.get('/at-risk', (req, res) => {
  const { class: cls, section, term, level } = req.query;
  let rows = buildCrossModuleRows({ cls, section, term }).filter(r => r.risk !== null);
  if (level) rows = rows.filter(r => r.risk.level === level);
  rows.sort((a, b) => b.risk.totalScore - a.risk.totalScore);
  res.json(rows);
});

// GET /api/reports/correlation?class=&term=
// Aggregate insight: average academic score bucketed by attendance band
// and by fee-collection band — the headline "cross-module" chart.
router.get('/correlation', (req, res) => {
  const { class: cls, section, term } = req.query;
  const rows = buildCrossModuleRows({ cls, section, term }).filter(r => r.attendance_pct !== null && r.avg_academic_pct !== null);

  const attendanceBands = [
    { label: '< 60%', test: (p) => p < 60 },
    { label: '60–75%', test: (p) => p >= 60 && p < 75 },
    { label: '75–90%', test: (p) => p >= 75 && p < 90 },
    { label: '90%+', test: (p) => p >= 90 },
  ];
  const byAttendance = attendanceBands.map((band) => {
    const inBand = rows.filter(r => band.test(r.attendance_pct));
    const avg = inBand.length ? inBand.reduce((s, r) => s + r.avg_academic_pct, 0) / inBand.length : null;
    return { band: band.label, student_count: inBand.length, avg_academic_pct: avg !== null ? Math.round(avg * 10) / 10 : null };
  });

  const feeBands = [
    { label: 'Has overdue fees', test: (r) => r.fee_summary.overdue > 0 },
    { label: 'Fully paid', test: (r) => r.fee_summary.overdue === 0 && r.fee_summary.partial === 0 },
  ];
  const byFeeStatus = feeBands.map((band) => {
    const inBand = rows.filter(band.test);
    const avgMarks = inBand.length ? inBand.reduce((s, r) => s + r.avg_academic_pct, 0) / inBand.length : null;
    const avgAttendance = inBand.length ? inBand.reduce((s, r) => s + r.attendance_pct, 0) / inBand.length : null;
    return {
      band: band.label,
      student_count: inBand.length,
      avg_academic_pct: avgMarks !== null ? Math.round(avgMarks * 10) / 10 : null,
      avg_attendance_pct: avgAttendance !== null ? Math.round(avgAttendance * 10) / 10 : null,
    };
  });

  const riskDistribution = { low: 0, medium: 0, high: 0 };
  rows.forEach(r => { if (r.risk) riskDistribution[r.risk.level]++; });

  res.json({
    scatter: rows.map(r => ({
      student_id: r.student.id,
      name: r.student.name,
      attendance_pct: r.attendance_pct,
      avg_academic_pct: r.avg_academic_pct,
      risk_level: r.risk ? r.risk.level : null,
    })),
    by_attendance_band: byAttendance,
    by_fee_status: byFeeStatus,
    risk_distribution: riskDistribution,
  });
});

module.exports = router;
