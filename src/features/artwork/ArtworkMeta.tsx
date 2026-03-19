import type {ReactNode} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import {YearDisplay} from '@/components/ui/YearDisplay';
import type {Artwork} from '@/types/artwork';

interface ArtworkMetaProps {
    artwork: Artwork;
}

interface MetaRowProps {
    label: string;
    value: string | null | ReactNode;
}

function MetaRow({label, value}: MetaRowProps) {
    if (value == null) return null;

    return (
        <TableRow sx={{'&:last-child td': {borderBottom: 0}}}>
            <TableCell
                component='th'
                scope='row'
                sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    width: 140,
                    pl: 0,
                }}
            >
                {label}
            </TableCell>
            <TableCell sx={{pr: 0}}>{value}</TableCell>
        </TableRow>
    );
}

export function ArtworkMeta({artwork}: ArtworkMetaProps) {
    return (
        <Box>
            {/* Title and Artist */}
            <Typography variant='h1' gutterBottom>
                {artwork.title}
            </Typography>
            <Typography variant='h5' color='text.secondary' sx={{mb: 3}}>
                {artwork.artist ?? 'Unknown Artist'}
            </Typography>

            {/* Metadata Table */}
            <Table size='small' sx={{mb: 3}}>
                <TableBody>
                    <MetaRow label='Accession Number' value={artwork.accessionNumber} />
                    <MetaRow label='Medium' value={artwork.medium} />
                    <MetaRow label='Dimensions' value={artwork.dimensions} />
                    <MetaRow label='Department' value={artwork.department} />
                    <MetaRow
                        label='Date'
                        value={
                            <YearDisplay
                                year={artwork.year}
                                yearEnd={artwork.yearEnd}
                                dateDisplay={artwork.dateDisplay}
                            />
                        }
                    />
                    <MetaRow label='Culture' value={artwork.culture} />
                    <MetaRow label='Classification' value={artwork.classification} />
                    <MetaRow label='Object Name' value={artwork.objectName} />
                    <MetaRow label='Credit Line' value={artwork.creditLine} />
                </TableBody>
            </Table>

            {/* Tags */}
            {artwork.tags.length > 0 && (
                <Box>
                    <Typography variant='body2' fontWeight={500} sx={{mb: 1}}>
                        Tags
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                        {artwork.tags.map((tag) => (
                            <Chip key={tag} label={tag} size='small' variant='outlined' />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
