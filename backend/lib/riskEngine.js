// The core "cross-module" logic: turns three independent module signals
// (attendance %, fee status, academic average) into one combined risk
// score + level. This is the piece a single-module report can't produce —
// it only exists because finance, attendance, and academics are joined.

function scoreAttendance(attendancePct) {
  if (attendancePct < 60) return 3;
  if (attendancePct < 75) return 2;
  if (attendancePct < 85) return 1;
  return 0;
}

function scoreFinance(feeStatusSummary) {
  // feeStatusSummary: { paid, partial, pending, overdue } counts
  if (feeStatusSummary.overdue >= 2) return 3;
  if (feeStatusSummary.overdue >= 1) return 2;
  if (feeStatusSummary.partial >= 1) return 1;
  return 0;
}

function scoreAcademics(avgMarks) {
  if (avgMarks < 40) return 3;
  if (avgMarks < 55) return 2;
  if (avgMarks < 70) return 1;
  return 0;
}

function combine(attendancePct, feeStatusSummary, avgMarks) {
  const aScore = scoreAttendance(attendancePct);
  const fScore = scoreFinance(feeStatusSummary);
  const mScore = scoreAcademics(avgMarks);
  const total = aScore + fScore + mScore;

  let level;
  if (total >= 6) level = 'high';
  else if (total >= 3) level = 'medium';
  else level = 'low';

  // Flag compounding risk: two+ modules independently red-flagging the
  // same student is a stronger, more actionable signal than one module
  // alone — this is the insight cross-module reporting is built for.
  const flaggedModules = [];
  if (aScore >= 2) flaggedModules.push('attendance');
  if (fScore >= 2) flaggedModules.push('finance');
  if (mScore >= 2) flaggedModules.push('academics');

  return {
    attendanceScore: aScore,
    financeScore: fScore,
    academicsScore: mScore,
    totalScore: total,
    level,
    compounding: flaggedModules.length >= 2,
    flaggedModules,
  };
}

module.exports = { combine, scoreAttendance, scoreFinance, scoreAcademics };
