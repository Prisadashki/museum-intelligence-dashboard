import {describe, it, expect} from 'vitest';
import {transformRawObject, emptyToNull, extractTags} from '@/transformers/artwork';
import {validRawObject} from '../fixtures/rawObject';
import {minimalRawObject} from '../fixtures/rawObjectMinimal';

describe('transformRawObject', () => {
    it('transforms a complete valid object with all fields mapped correctly', () => {
        const result = transformRawObject(validRawObject);

        expect(result).toEqual({
            id: 45734,
            title: 'Quail and Millet',
            artist: 'Kiyohara Yukinobu',
            year: 1667,
            yearEnd: 1682,
            dateDisplay: 'late 17th century',
            department: 'Asian Art',
            departmentId: 0,
            imageSmall: 'https://images.metmuseum.org/CRDImages/as/web-large/DP251139.jpg',
            imageLarge: 'https://images.metmuseum.org/CRDImages/as/original/DP251139.jpg',
            medium: 'Hanging scroll; ink and color on silk',
            dimensions: '46 5/8 x 18 3/4 in. (118.4 x 47.6 cm)',
            accessionNumber: '36.100.45',
            creditLine: 'The Howard Mansfield Collection, Purchase, Rogers Fund, 1936',
            tags: ['Birds', 'Nature'],
            culture: 'Japan',
            classification: 'Paintings',
            objectName: 'Hanging scroll',
            isPublicDomain: true,
        });
    });

    it('handles empty artistDisplayName → null', () => {
        const result = transformRawObject({
            ...validRawObject,
            artistDisplayName: '',
        });
        expect(result.artist).toBeNull();
    });

    it('handles missing title → "Untitled"', () => {
        const result = transformRawObject({...validRawObject, title: ''});
        expect(result.title).toBe('Untitled');
    });

    it('handles objectBeginDate of 0 → null year', () => {
        const result = transformRawObject({
            ...validRawObject,
            objectBeginDate: 0,
        });
        expect(result.year).toBeNull();
    });

    it('handles negative objectBeginDate (BCE dates)', () => {
        const result = transformRawObject({
            ...validRawObject,
            objectBeginDate: -500,
        });
        expect(result.year).toBe(-500);
    });

    it('handles null tags → empty array', () => {
        const result = transformRawObject({...validRawObject, tags: null});
        expect(result.tags).toEqual([]);
    });

    it('handles tags with empty terms → filters them out', () => {
        const result = transformRawObject({
            ...validRawObject,
            tags: [{term: 'Birds'}, {term: ''}, {term: 'Nature'}],
        });
        expect(result.tags).toEqual(['Birds', 'Nature']);
    });

    it('handles empty string fields → null', () => {
        const result = transformRawObject(minimalRawObject);

        expect(result.artist).toBeNull();
        expect(result.dateDisplay).toBeNull();
        expect(result.imageSmall).toBeNull();
        expect(result.imageLarge).toBeNull();
        expect(result.medium).toBeNull();
        expect(result.dimensions).toBeNull();
        expect(result.accessionNumber).toBeNull();
        expect(result.creditLine).toBeNull();
        expect(result.culture).toBeNull();
        expect(result.classification).toBeNull();
        expect(result.objectName).toBeNull();
    });

    it('handles whitespace-only strings → null', () => {
        const result = transformRawObject({
            ...validRawObject,
            artistDisplayName: '   ',
            medium: '  \t  ',
            culture: ' \n ',
        });

        expect(result.artist).toBeNull();
        expect(result.medium).toBeNull();
        expect(result.culture).toBeNull();
    });

    it('preserves valid non-empty fields', () => {
        const result = transformRawObject(validRawObject);

        expect(result.artist).toBe('Kiyohara Yukinobu');
        expect(result.medium).toBe('Hanging scroll; ink and color on silk');
        expect(result.culture).toBe('Japan');
        expect(result.classification).toBe('Paintings');
        expect(result.department).toBe('Asian Art');
        expect(result.isPublicDomain).toBe(true);
    });

    it('extracts tag terms from tag objects', () => {
        const result = transformRawObject(validRawObject);
        expect(result.tags).toEqual(['Birds', 'Nature']);
    });
});

describe('emptyToNull', () => {
    it('returns null for empty string', () => {
        expect(emptyToNull('')).toBeNull();
    });

    it('returns null for whitespace string', () => {
        expect(emptyToNull('   ')).toBeNull();
        expect(emptyToNull('\t')).toBeNull();
        expect(emptyToNull(' \n ')).toBeNull();
    });

    it('returns null for null input', () => {
        expect(emptyToNull(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
        expect(emptyToNull(undefined)).toBeNull();
    });

    it('returns trimmed string for valid input', () => {
        expect(emptyToNull('hello')).toBe('hello');
        expect(emptyToNull('  hello  ')).toBe('hello');
        expect(emptyToNull(' Kiyohara Yukinobu ')).toBe('Kiyohara Yukinobu');
    });
});

describe('extractTags', () => {
    it('extracts terms from valid tag array', () => {
        expect(extractTags([{term: 'Birds'}, {term: 'Nature'}])).toEqual(['Birds', 'Nature']);
    });

    it('returns empty array for null', () => {
        expect(extractTags(null)).toEqual([]);
    });

    it('returns empty array for empty array', () => {
        expect(extractTags([])).toEqual([]);
    });

    it('filters out tags with empty terms', () => {
        expect(extractTags([{term: 'Birds'}, {term: ''}, {term: '  '}, {term: 'Nature'}])).toEqual(['Birds', 'Nature']);
    });
});
