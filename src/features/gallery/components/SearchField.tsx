import {memo, useCallback} from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import {useDebouncedInput} from '@/hooks/useDebouncedInput';

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export const SearchField = memo(function SearchField({value, onChange}: SearchFieldProps) {
    const handleCommit = useCallback((val: string) => onChange(val), [onChange]);
    const [localValue, setLocalValue] = useDebouncedInput(value, handleCommit);

    return (
        <TextField
            label='Search'
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder='Search artworks...'
            fullWidth
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position='start'>
                            <SearchIcon color='action' />
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
});
