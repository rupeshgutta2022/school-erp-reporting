const state = {
  cls: '',
  section: '',
  view: 'all',
  rows: [],
};

const charts = {};

const RISK_COLOR = {
  high: '#B3452D',
  medium: '#A8791F',
  low: '#3F7A5C',
};

// ---------------- Init ----------------

async function init() {
  bindFilterEvents();
  bindModalEvents();
  await populateClassFilters();
  await loadEverything();
}

function bindFilterEvents() {
  document.getElementById('filterClass').addEventListener('change', (e) => {
    state.cls = e.target.value;
    populateSectionOptions();
    loadEverything();
  });
  document.getElementById('filterSection').addEventListener('change', (e) => {
    state.section = e.target.value;
    loadEverything();
  });
  document.getElementById('filterView').addEventListener('change', (e) => {
    state.view = e.target.value;
    renderTable();
  });
}

function bindModalEvents() {
  const backdrop = document.getElementById('modalBackdrop');
  document.getElementById('modalClose').addEventListener('click', () => backdrop.classList.remove('open'));
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') backdrop.classList.remove('open'); });
}

let allClassSections = [];

async function populateClassFilters() {
  allClassSections = await Api.classes();
  const classSelect = document.getElementById('filterClass');
  const classes = [...new Set(allClassSections.map(r => r.class))].sort((a, b) => Number(a) - Number(b));
  for (const c of classes) {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = `Class ${c}`;
    classSelect.appendChild(opt);
  }
  populateSectionOptions();
}

function populateSectionOptions() {
  const sectionSelect = document.getElementById('filterSection');
  sectionSelect.innerHTML = '<option value="">All</option>';
  const sections = [...new Set(
    allClassSections
      .filter(r => !state.cls || r.class === state.cls)
      .map(r => r.section)
  )].sort();
  for (const s of sections) {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = `Section ${s}`;
    sectionSelect.appendChild(opt);
  }
  state.section = '';
}

// ---------------- Data loading ----------------

async function loadEverything() {
  const params = { class: state.cls, section: state.section };
  const [rows, correlation] = await Promise.all([
    Api.crossModule(params),
    Api.correlation(params),
  ]);
  state.rows = rows;
  renderFigures(rows);
  renderTable();
  renderScatter(correlation.scatter);
  renderBandChart(correlation.by_attendance_band);
  renderRiskChart(correlation.risk_distribution);
  renderFeeCompare(correlation.by_fee_status);
}

// ---------------- Figures strip ----------------

function renderFigures(rows) {
  const withRisk = rows.filter(r => r.risk);
  const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const avgAttendance = avg(rows.filter(r => r.attendance_pct !== null).map(r => r.attendance_pct));
  const avgCollection = avg(rows.filter(r => r.fee_collection_pct !== null).map(r => r.fee_collection_pct));
  const avgAcademic = avg(rows.filter(r => r.avg_academic_pct !== null).map(r => r.avg_academic_pct));
  const highRisk = withRisk.filter(r => r.risk.level === 'high').length;
  const compounding = withRisk.filter(r => r.risk.compounding).length;

  const figures = [
    { value: rows.length, label: 'Students in view' },
    { value: `${avgAttendance.toFixed(1)}%`, label: 'Average attendance' },
    { value: `${avgCollection.toFixed(1)}%`, label: 'Fee collection rate' },
    { value: `${avgAcademic.toFixed(1)}%`, label: 'Average academic score' },
    { value: highRisk, label: 'Flagged high risk' },
    { value: compounding, label: 'Compounding across 2+ modules' },
  ];

  const el = document.getElementById('figuresRow');
  el.innerHTML = figures.map(f => `
    <div class="figure">
      <div class="figure-value">${f.value}</div>
      <div class="figure-label">${f.label}</div>
    </div>
  `).join('');
}

// ---------------- Table ----------------

function filteredRows() {
  if (state.view === 'all') return state.rows;
  if (state.view === 'compounding') return state.rows.filter(r => r.risk && r.risk.compounding);
  return state.rows.filter(r => r.risk && r.risk.level === state.view);
}

function renderTable() {
  const rows = filteredRows();
  const tbody = document.getElementById('reportTableBody');
  document.getElementById('ledgerNote').textContent =
    `${rows.length} student${rows.length === 1 ? '' : 's'} · sorted by class, section, name · click a row for the full record`;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--ink-faint); padding:30px;">No students match this view.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr data-id="${r.student.id}">
      <td>
        <span class="student-name">${escapeHtml(r.student.name)}</span>
        <span class="student-roll">${escapeHtml(r.student.roll_no)}</span>
      </td>
      <td>${escapeHtml(r.student.class)}${escapeHtml(r.student.section)}</td>
      <td class="num">${r.attendance_pct !== null ? r.attendance_pct + '%' : '—'}</td>
      <td class="num">${r.fee_collection_pct !== null ? r.fee_collection_pct + '%' : '—'}</td>
      <td class="num">${r.avg_academic_pct !== null ? r.avg_academic_pct + '%' : '—'}</td>
      <td>${riskBadge(r.risk)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr => {
    tr.addEventListener('click', () => openStudentModal(tr.dataset.id));
  });
}

function riskBadge(risk) {
  if (!risk) return '<span style="color:var(--ink-faint)">—</span>';
  const mark = risk.compounding ? '<span class="compound-mark" title="Flagged in 2+ modules">●●</span>' : '';
  return `<span class="badge badge--${risk.level}">${risk.level}</span>${mark}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------- Charts ----------------

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

function renderScatter(points) {
  destroyChart('scatter');
  const ctx = document.getElementById('scatterChart');
  const byLevel = { high: [], medium: [], low: [], null: [] };
  points.forEach(p => {
    const key = p.risk_level || 'null';
    byLevel[key].push({ x: p.attendance_pct, y: p.avg_academic_pct, name: p.name });
  });

  charts.scatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: ['high', 'medium', 'low'].map(level => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        data: byLevel[level],
        backgroundColor: RISK_COLOR[level],
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Attendance %' }, min: 0, max: 100, grid: { color: '#E7EBE3' } },
        y: { title: { display: true, text: 'Academic average %' }, min: 0, max: 100, grid: { color: '#E7EBE3' } },
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.name}: ${ctx.raw.x}% attendance, ${ctx.raw.y}% marks`,
          },
        },
      },
    },
  });
}

function renderBandChart(bands) {
  destroyChart('band');
  const ctx = document.getElementById('bandChart');
  charts.band = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bands.map(b => b.band),
      datasets: [{
        label: 'Average academic score',
        data: bands.map(b => b.avg_academic_pct),
        backgroundColor: '#8A6D3B',
        borderRadius: 3,
        maxBarThickness: 46,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, title: { display: true, text: 'Academic avg %' }, grid: { color: '#E7EBE3' } },
        x: { title: { display: true, text: 'Attendance band' }, grid: { display: false } },
      },
    },
  });
}

function renderRiskChart(dist) {
  destroyChart('risk');
  const ctx = document.getElementById('riskChart');
  charts.risk = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: [dist.high, dist.medium, dist.low],
        backgroundColor: [RISK_COLOR.high, RISK_COLOR.medium, RISK_COLOR.low],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11 } } },
      },
    },
  });
}

function renderFeeCompare(bands) {
  const el = document.getElementById('feeCompare');
  el.innerHTML = bands.map(b => `
    <div class="fee-compare-row">
      <div class="fee-compare-label">
        ${escapeHtml(b.band)}
        <span class="fee-compare-sub">${b.student_count} students</span>
      </div>
      <div class="fee-compare-metrics">
        <b>${b.avg_academic_pct !== null ? b.avg_academic_pct + '%' : '—'}</b> avg marks<br>
        <b>${b.avg_attendance_pct !== null ? b.avg_attendance_pct + '%' : '—'}</b> avg attendance
      </div>
    </div>
  `).join('');
}

// ---------------- Student detail modal ----------------

async function openStudentModal(studentId) {
  const backdrop = document.getElementById('modalBackdrop');
  const content = document.getElementById('modalContent');
  content.innerHTML = '<p style="color:var(--ink-soft)">Loading record…</p>';
  backdrop.classList.add('open');

  const detail = await Api.crossModuleDetail(studentId, { class: state.cls, section: state.section });
  const risk = detail.risk;

  const feeRows = detail.fee_payments.map(f => `
    <tr>
      <td>${escapeHtml(f.fee_type)}</td>
      <td class="num">₹${f.amount_paid.toLocaleString('en-IN')} / ₹${f.amount_due.toLocaleString('en-IN')}</td>
      <td class="num"><span class="badge badge--${f.status === 'paid' ? 'low' : f.status === 'overdue' ? 'high' : 'medium'}">${f.status}</span></td>
    </tr>
  `).join('');

  const examRows = detail.exam_results.map(e => `
    <tr>
      <td>${escapeHtml(e.subject)}</td>
      <td class="num">${e.marks_obtained} / ${e.max_marks}</td>
    </tr>
  `).join('');

  const presentDays = detail.attendance_history.filter(a => a.status === 'present' || a.status === 'late').length;
  const totalDays = detail.attendance_history.length;
  const absentDays = detail.attendance_history.filter(a => a.status === 'absent').length;

  content.innerHTML = `
    <h2 id="modalName">${escapeHtml(detail.student.name)}</h2>
    <p class="modal-sub">Roll ${escapeHtml(detail.student.roll_no)} · Class ${escapeHtml(detail.student.class)}${escapeHtml(detail.student.section)}</p>

    <div class="modal-stats">
      <div class="modal-stat">
        <div class="modal-stat-value">${detail.attendance_pct !== null ? detail.attendance_pct + '%' : '—'}</div>
        <div class="modal-stat-label">Attendance (${presentDays}/${totalDays} days, ${absentDays} absent)</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-value">${detail.fee_collection_pct !== null ? detail.fee_collection_pct + '%' : '—'}</div>
        <div class="modal-stat-label">Fees collected (₹${detail.fee_paid_total.toLocaleString('en-IN')} of ₹${detail.fee_due_total.toLocaleString('en-IN')})</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-value">${detail.avg_academic_pct !== null ? detail.avg_academic_pct + '%' : '—'}</div>
        <div class="modal-stat-label">Academic average</div>
      </div>
    </div>

    ${risk ? `
      <p style="margin:0 0 4px;">
        Combined risk: ${riskBadge(risk)}
        <span style="color:var(--ink-soft); font-size:12.5px; margin-left:6px;">score ${risk.totalScore}/9</span>
      </p>
      ${risk.flaggedModules.length ? `
        <div class="flag-list">
          ${risk.flaggedModules.map(m => `<span class="flag-chip">flagged: ${m}</span>`).join('')}
        </div>
      ` : ''}
    ` : ''}

    <p class="modal-section-title">Fee payments</p>
    <table class="mini-table"><tbody>${feeRows}</tbody></table>

    <p class="modal-section-title">Exam results</p>
    <table class="mini-table"><tbody>${examRows}</tbody></table>
  `;
}

init();
