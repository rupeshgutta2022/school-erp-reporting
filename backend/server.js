const express = require('express');
const cors = require('cors');
const path = require('path');

const studentsRoutes = require('./routes/students');
const financeRoutes = require('./routes/finance');
const attendanceRoutes = require('./routes/attendance');
const academicsRoutes = require('./routes/academics');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/students', studentsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academics', academicsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend as static files so the whole app runs from one port.
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`School ERP reporting server running at http://localhost:${PORT}`);
});
