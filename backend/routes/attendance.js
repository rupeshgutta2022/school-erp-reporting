const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/attendance/summary?class=&term=
router.get('/summary', (req, res) => {
  const { class: cls, term } = req.query;
  let query = `
    SELECT s.class,
           ROUND(100.0 * SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) / COUNT(*), 1) AS avg_attendance_pct,
           COUNT(DISTINCT a.student_id) AS student_count
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    WHERE 1=1
  `;
  const params = [];
  if (cls) { query += ' AND s.class = ?'; params.push(cls); }
  if (term) { query += ' AND a.term = ?'; params.push(term); }
  query += ' GROUP BY s.class ORDER BY s.class';
  res.json(db.prepare(query).all(...params));
});

// GET /api/attendance/student/:id?term=
router.get('/student/:id', (req, res) => {
  const { term } = req.query;
  let query = 'SELECT * FROM attendance WHERE student_id = ?';
  const params = [req.params.id];
  if (term) { query += ' AND term = ?'; params.push(term); }
  query += ' ORDER BY date';
  res.json(db.prepare(query).all(...params));
});

module.exports = router;
