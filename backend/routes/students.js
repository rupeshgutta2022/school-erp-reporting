const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/students?class=8&section=A
router.get('/', (req, res) => {
  const { class: cls, section } = req.query;
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];
  if (cls) { query += ' AND class = ?'; params.push(cls); }
  if (section) { query += ' AND section = ?'; params.push(section); }
  query += ' ORDER BY class, section, name';
  res.json(db.prepare(query).all(...params));
});

// GET /api/students/classes  -> distinct class/section list for filter dropdowns
router.get('/classes', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT class, section FROM students ORDER BY class, section').all();
  res.json(rows);
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

module.exports = router;
