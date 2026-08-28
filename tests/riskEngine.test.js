const { scoreAttendance, scoreFinance, scoreAcademics, combine } = require('../backend/lib/riskEngine');

describe('Cross-Module Risk Engine Tests', () => {
  describe('Individual Signal Scoring', () => {
    test('should score attendance rates correctly', () => {
      expect(scoreAttendance(50)).toBe(3); // < 60% -> 3
      expect(scoreAttendance(70)).toBe(2); // < 75% -> 2
      expect(scoreAttendance(80)).toBe(1); // < 85% -> 1
      expect(scoreAttendance(95)).toBe(0); // >= 85% -> 0
    });

    test('should score fee status accurately', () => {
      expect(scoreFinance({ overdue: 2, partial: 0, paid: 0, pending: 0 })).toBe(3);
      expect(scoreFinance({ overdue: 1, partial: 0, paid: 1, pending: 0 })).toBe(2);
      expect(scoreFinance({ overdue: 0, partial: 2, paid: 1, pending: 0 })).toBe(1);
      expect(scoreFinance({ overdue: 0, partial: 0, paid: 4, pending: 0 })).toBe(0);
    });

    test('should score academic marks accurately', () => {
      expect(scoreAcademics(35)).toBe(3); // < 40 -> 3
      expect(scoreAcademics(50)).toBe(2); // < 55 -> 2
      expect(scoreAcademics(65)).toBe(1); // < 70 -> 1
      expect(scoreAcademics(85)).toBe(0); // >= 70 -> 0
    });
  });

  describe('Combined Risk Assessment', () => {
    test('should identify low risk student', () => {
      const result = combine(95, { overdue: 0, partial: 0, paid: 4, pending: 0 }, 88);
      expect(result.totalScore).toBe(0);
      expect(result.level).toBe('low');
      expect(result.compounding).toBe(false);
      expect(result.flaggedModules.length).toBe(0);
    });

    test('should identify medium risk student', () => {
      const result = combine(70, { overdue: 0, partial: 1, paid: 2, pending: 0 }, 68);
      // attendance: 2, finance: 1, academics: 1 -> total: 4
      expect(result.totalScore).toBe(4);
      expect(result.level).toBe('medium');
      expect(result.compounding).toBe(false);
    });

    test('should detect high risk and compounding multi-module signals', () => {
      const result = combine(55, { overdue: 2, partial: 0, paid: 0, pending: 0 }, 38);
      // attendance: 3, finance: 3, academics: 3 -> total: 9
      expect(result.totalScore).toBe(9);
      expect(result.level).toBe('high');
      expect(result.compounding).toBe(true);
      expect(result.flaggedModules).toEqual(['attendance', 'finance', 'academics']);
    });
  });
});
