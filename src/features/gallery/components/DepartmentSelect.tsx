import {memo, useCallback} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import type {Department} from '@/types/artwork';

interface DepartmentSelectProps {
    value: number | null;
    onChange: (value: number | null) => void;
    departments: Department[] | undefined;
    isLoading: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

export const DepartmentSelect = memo(function DepartmentSelect({
    value,
    onChange,
    departments,
    isLoading,
    isError = false,
    onRetry,
}: DepartmentSelectProps) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            onChange(val === '' ? null : parseInt(val, 10));
        },
        [onChange],
    );

    // Show error state with retry button
    if (isError && !departments?.length) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    border: 1,
                    borderColor: 'error.main',
                    borderRadius: 1,
                    bgcolor: 'error.lighter',
                }}
            >
                <Typography variant='body2' color='error.main' sx={{flex: 1}}>
                    Failed to load departments
                </Typography>
                {onRetry && (
                    <Button size='small' variant='outlined' color='error' startIcon={<RefreshIcon />} onClick={onRetry}>
                        Retry
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <TextField select label='Department' value={value ?? ''} onChange={handleChange} disabled={isLoading} fullWidth>
            <MenuItem value=''>All Departments</MenuItem>
            {departments?.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                </MenuItem>
            ))}
        </TextField>
    );
});
