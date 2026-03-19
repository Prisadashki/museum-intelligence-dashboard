import {describe, it, expect} from 'vitest';
import {formatYear, formatYearRange} from '@/utils/date';

describe('formatYear', () => {
    it('formats positive year as CE', () => {
        expect(formatYear(1200)).toBe('1200 CE');
    });

    it('formats negative year as BCE', () => {
        expect(formatYear(-500)).toBe('500 BCE');
    });

    it('formats year 0 as "1 BCE"', () => {
        expect(formatYear(0)).toBe('1 BCE');
    });

    it('returns "Date unknown" for null', () => {
        expect(formatYear(null)).toBe('Date unknown');
    });

    it('handles year 1 as "1 CE"', () => {
        expect(formatYear(1)).toBe('1 CE');
    });

    it('handles large negative years', () => {
        expect(formatYear(-3000)).toBe('3000 BCE');
    });
});

describe('formatYearRange', () => {
    it('formats same year as single year display', () => {
        expect(formatYearRange(1200, 1200)).toBe('1200 CE');
    });

    it('formats CE range', () => {
        expect(formatYearRange(1200, 1250)).toBe('1200\u20131250 CE');
    });

    it('formats BCE range', () => {
        expect(formatYearRange(-500, -450)).toBe('500\u2013450 BCE');
    });

    it('formats cross-era range', () => {
        expect(formatYearRange(-100, 100)).toBe('100 BCE \u2013 100 CE');
    });

    it('handles null values gracefully', () => {
        expect(formatYearRange(null, null)).toBe('Date unknown');
        expect(formatYearRange(null, 1200)).toBe('1200 CE');
        expect(formatYearRange(1200, null)).toBe('1200 CE');
    });
});
