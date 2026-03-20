import {memo, useCallback} from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

interface FilterCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}

export const FilterCheckbox = memo(function FilterCheckbox({
    checked,
    onChange,
    label,
    description,
}: FilterCheckboxProps) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.checked);
        },
        [onChange],
    );

    return (
        <FormControlLabel
            control={<Checkbox checked={checked} onChange={handleChange} />}
            label={
                <Box>
                    <Typography variant='body2' component='span'>
                        {label}
                    </Typography>
                    {description && (
                        <Typography variant='caption' color='text.secondary' sx={{ml: 1}}>
                            ({description})
                        </Typography>
                    )}
                </Box>
            }
        />
    );
});
