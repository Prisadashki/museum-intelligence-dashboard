import {describe, it, expect} from 'vitest';
import {rawMetObjectSchema, searchResponseSchema, departmentsResponseSchema} from '@/api/schemas';
import {validRawObject} from '../fixtures/rawObject';
import {searchResponseFixture, emptySearchResponse} from '../fixtures/searchResponse';
import {departmentsFixture} from '../fixtures/departments';

describe('rawMetObjectSchema', () => {
    it('parses a valid complete object', () => {
        const result = rawMetObjectSchema.parse(validRawObject);

        expect(result.objectID).toBe(45734);
        expect(result.title).toBe('Quail and Millet');
        expect(result.artistDisplayName).toBe('Kiyohara Yukinobu');
        expect(result.tags).toEqual([{term: 'Birds'}, {term: 'Nature'}]);
        expect(result.isPublicDomain).toBe(true);
    });

    it('applies defaults for missing optional fields', () => {
        const result = rawMetObjectSchema.parse({objectID: 1});

        expect(result.title).toBe('');
        expect(result.artistDisplayName).toBe('');
        expect(result.objectDate).toBe('');
        expect(result.objectBeginDate).toBe(0);
        expect(result.objectEndDate).toBe(0);
        expect(result.department).toBe('');
        expect(result.primaryImage).toBe('');
        expect(result.primaryImageSmall).toBe('');
        expect(result.medium).toBe('');
        expect(result.dimensions).toBe('');
        expect(result.accessionNumber).toBe('');
        expect(result.creditLine).toBe('');
        expect(result.tags).toBeNull();
        expect(result.culture).toBe('');
        expect(result.classification).toBe('');
        expect(result.objectName).toBe('');
        expect(result.isPublicDomain).toBe(false);
    });

    it('handles null tags field', () => {
        const result = rawMetObjectSchema.parse({objectID: 1, tags: null});
        expect(result.tags).toBeNull();
    });

    it('passes through unknown fields without error', () => {
        const input = {objectID: 1, unknownField: 'test', anotherField: 42};
        const result = rawMetObjectSchema.parse(input);

        expect(result.objectID).toBe(1);
        expect((result as Record<string, unknown>)['unknownField']).toBe('test');
        expect((result as Record<string, unknown>)['anotherField']).toBe(42);
    });

    it('requires objectID to be a number', () => {
        expect(() => rawMetObjectSchema.parse({objectID: 'not-a-number'})).toThrow();
        expect(() => rawMetObjectSchema.parse({})).toThrow();
    });
});

describe('searchResponseSchema', () => {
    it('parses valid search response', () => {
        const result = searchResponseSchema.parse(searchResponseFixture);

        expect(result.total).toBe(50);
        expect(result.objectIDs).toHaveLength(50);
        expect(result.objectIDs![0]).toBe(1);
        expect(result.objectIDs![49]).toBe(50);
    });

    it('handles null objectIDs (no results)', () => {
        const result = searchResponseSchema.parse(emptySearchResponse);

        expect(result.total).toBe(0);
        expect(result.objectIDs).toBeNull();
    });
});

describe('departmentsResponseSchema', () => {
    it('parses valid departments response', () => {
        const result = departmentsResponseSchema.parse(departmentsFixture);

        expect(result.departments).toHaveLength(5);
        expect(result.departments[0]).toEqual({
            departmentId: 1,
            displayName: 'American Decorative Arts',
        });
        expect(result.departments[1]).toEqual({
            departmentId: 6,
            displayName: 'Asian Art',
        });
    });
});
