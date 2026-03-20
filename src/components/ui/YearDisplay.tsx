import {memo} from 'react';
import {formatYear, formatYearRange} from '@/utils/date';

interface YearDisplayProps {
    year: number | null;
    yearEnd?: number | null;
    dateDisplay?: string | null;
}

/**
 * Displays artwork date information with proper BCE/CE formatting.
 * Uses dateDisplay if available (human-readable from API), otherwise
 * formats the year/yearEnd range.
 */
export const YearDisplay = memo(function YearDisplay({year, yearEnd, dateDisplay}: YearDisplayProps) {
    // Prefer the human-readable date string from the API when available
    if (dateDisplay) {
        return <span>{dateDisplay}</span>;
    }

    // Use year range if both years are available and different
    if (year != null && yearEnd != null && year !== yearEnd) {
        return <span>{formatYearRange(year, yearEnd)}</span>;
    }

    // Fall back to single year display
    return <span>{formatYear(year)}</span>;
});
