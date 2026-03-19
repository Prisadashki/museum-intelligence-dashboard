import type {RawMetObject} from '@/types/api';
import type {Artwork} from '@/types/artwork';

/**
 * Transforms a raw Met API object response into our internal Artwork model.
 */
export function transformRawObject(raw: RawMetObject): Artwork {
    return {
        id: raw.objectID,
        title: raw.title || 'Untitled',
        artist: emptyToNull(raw.artistDisplayName),
        year: raw.objectBeginDate !== 0 ? raw.objectBeginDate : null,
        yearEnd: raw.objectEndDate !== 0 ? raw.objectEndDate : null,
        dateDisplay: emptyToNull(raw.objectDate),
        department: raw.department || 'Unknown Department',
        departmentId: 0,
        imageSmall: emptyToNull(raw.primaryImageSmall),
        imageLarge: emptyToNull(raw.primaryImage),
        medium: emptyToNull(raw.medium),
        dimensions: emptyToNull(raw.dimensions),
        accessionNumber: emptyToNull(raw.accessionNumber),
        creditLine: emptyToNull(raw.creditLine),
        tags: extractTags(raw.tags),
        culture: emptyToNull(raw.culture),
        classification: emptyToNull(raw.classification),
        objectName: emptyToNull(raw.objectName),
        isPublicDomain: raw.isPublicDomain,
    };
}

/**
 * Converts empty/whitespace strings to null.
 */
export function emptyToNull(value: string | null | undefined): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

/**
 * Extracts term strings from the API's tag objects.
 */
export function extractTags(tags: Array<{term: string}> | null | undefined): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.map((tag) => tag.term).filter((term): term is string => typeof term === 'string' && term.trim() !== '');
}
