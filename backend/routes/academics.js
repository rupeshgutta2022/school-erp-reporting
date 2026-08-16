const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/academics/summary?class=&term=
router.get('/summary', (req, res) => {
  const { class: cls, term } = req.query;
  let query = `
    SELECT s.class,
           ROUND(AVG(100.0 * er.marks_obtained / er.max_marks), 1) AS avg_score_pct,
           COUNT(DISTINCT er.student_id) AS student_count
    FROM exam_results er
    JOIN students s ON s.id = er.student_id
    JOIN exams e ON e.id = er.exam_id
    WHERE 1=1
  `;
  const params = [];
  if (cls) { query += ' AND s.class = ?'; params.push(cls); }
  if (term) { query += ' AND e.term = ?'; params.push(term); }
  query += ' GROUP BY s.class ORDER BY s.class';
  res.json(db.prepare(query).all(...params));
});

// GET /api/academics/student/:id
router.get('/student/:id', (req, res) => {
  const rows = db.prepare(`
    SELECT er.*, e.name AS exam_name, e.term
    FROM exam_results er
    JOIN exams e ON e.id = er.exam_id
    WHERE er.student_id = ?
    ORDER BY e.exam_date, er.subject
  `).all(req.params.id);
  res.json(rows);
});

module.exports = router;
