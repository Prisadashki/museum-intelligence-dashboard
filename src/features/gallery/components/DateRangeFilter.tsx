import {memo, useCallback} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {useDebouncedInput} from '@/hooks/useDebouncedInput';

interface DateRangeFilterProps {
    fromYear: number | null;
    toYear: number | null;
    onFromYearChange: (value: number | null) => void;
    onToYearChange: (value: number | null) => void;
}

export const DateRangeFilter = memo(function DateRangeFilter({
    fromYear,
    toYear,
    onFromYearChange,
    onToYearChange,
}: DateRangeFilterProps) {
    const handleFromYearCommit = useCallback(
        (value: string) => {
            const parsed = value === '' ? null : parseInt(value, 10);
            onFromYearChange(Number.isNaN(parsed) ? null : parsed);
        },
        [onFromYearChange],
    );

    const handleToYearCommit = useCallback(
        (value: string) => {
            const parsed = value === '' ? null : parseInt(value, 10);
            onToYearChange(Number.isNaN(parsed) ? null : parsed);
        },
        [onToYearChange],
    );

    const [localFromYear, setLocalFromYear] = useDebouncedInput(
        fromYear != null ? String(fromYear) : '',
        handleFromYearCommit,
    );

    const [localToYear, setLocalToYear] = useDebouncedInput(toYear != null ? String(toYear) : '', handleToYearCommit);

    return (
        <Box>
            <Typography variant='body2' color='text.secondary' sx={{mb: 1}}>
                Date Range
            </Typography>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                <TextField
                    type='number'
                    value={localFromYear}
                    onChange={(e) => setLocalFromYear(e.target.value)}
                    placeholder='From year'
                    aria-label='From year'
                    sx={{flex: 1}}
                />
                <Typography variant='body2' color='text.secondary'>
                    to
                </Typography>
                <TextField
                    type='number'
                    value={localToYear}
                    onChange={(e) => setLocalToYear(e.target.value)}
                    placeholder='To year'
                    aria-label='To year'
                    sx={{flex: 1}}
                />
            </Box>
            <Typography variant='caption' color='text.secondary' sx={{mt: 0.5, display: 'block'}}>
                Use negative numbers for BCE (e.g., -500)
            </Typography>
        </Box>
    );
});
