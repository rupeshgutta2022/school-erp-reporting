const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/finance/summary?class=&term=
router.get('/summary', (req, res) => {
  const { class: cls, term } = req.query;
  let query = `
    SELECT s.class, fp.status, COUNT(*) AS count, SUM(fp.amount_due) AS due, SUM(fp.amount_paid) AS paid
    FROM fee_payments fp
    JOIN students s ON s.id = fp.student_id
    WHERE 1=1
  `;
  const params = [];
  if (cls) { query += ' AND s.class = ?'; params.push(cls); }
  if (term) { query += ' AND fp.term = ?'; params.push(term); }
  query += ' GROUP BY s.class, fp.status ORDER BY s.class, fp.status';
  res.json(db.prepare(query).all(...params));
});

// GET /api/finance/student/:id
router.get('/student/:id', (req, res) => {
  const rows = db.prepare('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY fee_type').all(req.params.id);
  res.json(rows);
});

module.exports = router;
