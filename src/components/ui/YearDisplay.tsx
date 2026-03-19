import {memo} from 'react';
import {formatYear} from '@/utils/date';

interface YearDisplayProps {
    year: number | null;
    yearEnd?: number | null;
    dateDisplay?: string | null;
}

export const YearDisplay = memo(function YearDisplay({year, dateDisplay}: YearDisplayProps) {
    if (dateDisplay) {
        return <span>{dateDisplay}</span>;
    }
    return <span>{formatYear(year)}</span>;
});
