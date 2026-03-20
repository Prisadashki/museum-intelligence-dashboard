import {memo, useCallback} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import {useDepartments} from '@/hooks/useDepartments';
import {useGalleryFilters} from '@/hooks/useGalleryFilters';
import {SearchField, DepartmentSelect, DateRangeFilter, FilterCheckbox} from './components';

export const GalleryFilters = memo(function GalleryFilters() {
    const {filters, setFilters, resetFilters} = useGalleryFilters();
    const {
        data: departments,
        isLoading: isDepartmentsLoading,
        isError: isDepartmentsError,
        refetch: refetchDepartments,
    } = useDepartments();

    const handleQueryChange = useCallback((value: string) => setFilters({query: value}), [setFilters]);

    const handleDepartmentChange = useCallback(
        (value: number | null) => setFilters({departmentId: value}),
        [setFilters],
    );

    const handleFromYearChange = useCallback((value: number | null) => setFilters({fromYear: value}), [setFilters]);

    const handleToYearChange = useCallback((value: number | null) => setFilters({toYear: value}), [setFilters]);

    const handleHighlightsChange = useCallback(
        (checked: boolean) => setFilters({highlightsOnly: checked}),
        [setFilters],
    );

    const handleIncludeWithoutImagesChange = useCallback(
        (checked: boolean) => setFilters({includeWithoutImages: checked}),
        [setFilters],
    );

    const handleRetryDepartments = useCallback(() => {
        refetchDepartments();
    }, [refetchDepartments]);

    const hasActiveFilters =
        filters.query !== '' ||
        filters.departmentId != null ||
        filters.fromYear != null ||
        filters.toYear != null ||
        filters.highlightsOnly ||
        filters.includeWithoutImages;

    return (
        <Paper sx={{p: 3, mb: 3}}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                <SearchField value={filters.query} onChange={handleQueryChange} />

                <DepartmentSelect
                    value={filters.departmentId}
                    onChange={handleDepartmentChange}
                    departments={departments}
                    isLoading={isDepartmentsLoading}
                    isError={isDepartmentsError}
                    onRetry={handleRetryDepartments}
                />

                <DateRangeFilter
                    fromYear={filters.fromYear}
                    toYear={filters.toYear}
                    onFromYearChange={handleFromYearChange}
                    onToYearChange={handleToYearChange}
                />

                <FilterCheckbox
                    checked={filters.highlightsOnly}
                    onChange={handleHighlightsChange}
                    label='Highlights only'
                    description='curated masterpieces'
                />

                <FilterCheckbox
                    checked={filters.includeWithoutImages}
                    onChange={handleIncludeWithoutImagesChange}
                    label='Include artworks without images'
                    description='shows all artworks'
                />

                {hasActiveFilters && (
                    <Button variant='text' color='inherit' onClick={resetFilters} sx={{alignSelf: 'flex-start'}}>
                        Reset Filters
                    </Button>
                )}
            </Box>
        </Paper>
    );
});
