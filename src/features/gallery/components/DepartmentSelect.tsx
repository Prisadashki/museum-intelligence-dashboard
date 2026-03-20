import {memo, useCallback} from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

interface Department {
    id: number;
    name: string;
}

interface DepartmentSelectProps {
    value: number | null;
    onChange: (value: number | null) => void;
    departments: Department[] | undefined;
    isLoading: boolean;
}

export const DepartmentSelect = memo(function DepartmentSelect({
    value,
    onChange,
    departments,
    isLoading,
}: DepartmentSelectProps) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            onChange(val === '' ? null : parseInt(val, 10));
        },
        [onChange],
    );

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
