import {useState, useEffect, useCallback, useRef} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import {useDepartments} from '@/hooks/useDepartments';
import {useGalleryFilters} from '@/hooks/useGalleryFilters';

const DEBOUNCE_MS = 400;

/**
 * Custom hook for debounced input.
 * Input changes are committed to external state after debounce.
 * External state changes are synced back to local input (e.g., browser back/forward).
 */
function useDebouncedInput(externalValue: string, onCommit: (value: string) => void, debounceMs: number = DEBOUNCE_MS) {
    const [localValue, setLocalValue] = useState(externalValue);
    // Track the last value we committed to know if external changes came from us
    const lastCommittedRef = useRef(externalValue);

    // Sync external changes back to local state (e.g., browser navigation, reset).
    // This is a legitimate use of setState in an effect: we're synchronizing with
    // an external source (URL/router state) that changed independently.
    useEffect(() => {
        // Only sync if external value changed AND it wasn't from our commit
        if (externalValue !== localValue && externalValue !== lastCommittedRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with external URL state (browser navigation)
            setLocalValue(externalValue);
            lastCommittedRef.current = externalValue;
        }
    }, [externalValue, localValue]);

    // Debounced commit to external state
    useEffect(() => {
        if (localValue === externalValue) {
            return;
        }

        const timer = setTimeout(() => {
            lastCommittedRef.current = localValue;
            onCommit(localValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localValue, externalValue, onCommit, debounceMs]);

    return [localValue, setLocalValue] as const;
}

export function GalleryFilters() {
    const {filters, setFilters, resetFilters} = useGalleryFilters();
    const {data: departments, isLoading: isDepartmentsLoading} = useDepartments();

    return (
        <Paper sx={{p: 3, mb: 3}}>
            <GalleryFiltersInner
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
                departments={departments}
                isDepartmentsLoading={isDepartmentsLoading}
            />
        </Paper>
    );
}

interface GalleryFiltersInnerProps {
    filters: ReturnType<typeof useGalleryFilters>['filters'];
    setFilters: ReturnType<typeof useGalleryFilters>['setFilters'];
    resetFilters: ReturnType<typeof useGalleryFilters>['resetFilters'];
    departments: {id: number; name: string}[] | undefined;
    isDepartmentsLoading: boolean;
}

function GalleryFiltersInner({
    filters,
    setFilters,
    resetFilters,
    departments,
    isDepartmentsLoading,
}: GalleryFiltersInnerProps) {
    const handleQueryCommit = useCallback((value: string) => setFilters({query: value}), [setFilters]);

    const handleFromYearCommit = useCallback(
        (value: string) => {
            const parsed = value === '' ? null : parseInt(value, 10);
            setFilters({fromYear: Number.isNaN(parsed) ? null : parsed});
        },
        [setFilters],
    );

    const handleToYearCommit = useCallback(
        (value: string) => {
            const parsed = value === '' ? null : parseInt(value, 10);
            setFilters({toYear: Number.isNaN(parsed) ? null : parsed});
        },
        [setFilters],
    );

    const [localQuery, setLocalQuery] = useDebouncedInput(filters.query, handleQueryCommit);

    const [localFromYear, setLocalFromYear] = useDebouncedInput(
        filters.fromYear != null ? String(filters.fromYear) : '',
        handleFromYearCommit,
    );

    const [localToYear, setLocalToYear] = useDebouncedInput(
        filters.toYear != null ? String(filters.toYear) : '',
        handleToYearCommit,
    );

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilters({departmentId: value === '' ? null : parseInt(value, 10)});
    };

    const handleReset = () => {
        resetFilters();
    };

    const hasActiveFilters =
        filters.query !== '' ||
        filters.departmentId != null ||
        filters.fromYear != null ||
        filters.toYear != null || filters.highlightsOnly || filters.includeWithoutImages;

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
            {/* Search Field */}
            <TextField
                label='Search'
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
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

            {/* Department Select */}
            <TextField
                select
                label='Department'
                value={filters.departmentId ?? ''}
                onChange={handleDepartmentChange}
                disabled={isDepartmentsLoading}
                fullWidth
            >
                <MenuItem value=''>All Departments</MenuItem>
                {departments?.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                    </MenuItem>
                ))}
            </TextField>

            {/* Date Range */}
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
                        sx={{flex: 1}}
                    />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{mt: 0.5, display: 'block'}}>
                    Use negative numbers for BCE (e.g., -500)
                </Typography>
            </Box>

            {/* Highlights Only */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.highlightsOnly}
                        onChange={(e) => setFilters({highlightsOnly: e.target.checked})}
                    />
                }
                label={
                    <Box>
                        <Typography variant='body2' component='span'>
                            Highlights only
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ml: 1}}>
                            (curated masterpieces)
                        </Typography>
                    </Box>
                }
            />

            {/* Include artworks without images */}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.includeWithoutImages}
                        onChange={(e) => setFilters({includeWithoutImages: e.target.checked})}
                    />
                }
                label={
                    <Box>
                        <Typography variant='body2' component='span'>
                            Include artworks without images
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ml: 1}}>
                            (shows all artworks)
                        </Typography>
                    </Box>
                }
            />

            {/* Reset Button */}
            {hasActiveFilters && (
                <Button variant='text' color='inherit' onClick={handleReset} sx={{alignSelf: 'flex-start'}}>
                    Reset Filters
                </Button>
            )}
        </Box>
    );
}
