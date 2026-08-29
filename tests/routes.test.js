const riskEngine = require('../backend/lib/riskEngine');

describe('Reporting Service Module Tests', () => {
  test('should provide valid risk engine interface', () => {
    expect(typeof riskEngine.combine).toBe('function');
    expect(typeof riskEngine.scoreAttendance).toBe('function');
    expect(typeof riskEngine.scoreFinance).toBe('function');
    expect(typeof riskEngine.scoreAcademics).toBe('function');
  });

  test('should evaluate boundary score conditions', () => {
    const edge = riskEngine.combine(60, { overdue: 0, partial: 0, paid: 0 }, 55);
    expect(edge.totalScore).toBeDefined();
    expect(typeof edge.level).toBe('string');
  });
});
