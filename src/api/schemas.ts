import {z} from 'zod';

const tagSchema = z.object({
    term: z.string(),
    AAT_URL: z.string().nullable().optional(),
    Wikidata_URL: z.string().nullable().optional(),
});

export const rawMetObjectSchema = z
    .object({
        objectID: z.number(),
        title: z.string().default(''),
        artistDisplayName: z.string().default(''),
        objectDate: z.string().default(''),
        objectBeginDate: z.number().default(0),
        objectEndDate: z.number().default(0),
        department: z.string().default(''),
        primaryImage: z.string().default(''),
        primaryImageSmall: z.string().default(''),
        medium: z.string().default(''),
        dimensions: z.string().default(''),
        accessionNumber: z.string().default(''),
        creditLine: z.string().default(''),
        tags: z.array(tagSchema).nullable().default(null),
        culture: z.string().default(''),
        classification: z.string().default(''),
        objectName: z.string().default(''),
        isPublicDomain: z.boolean().default(false),
    })
    .passthrough();

export const searchResponseSchema = z.object({
    total: z.number(),
    objectIDs: z.array(z.number()).nullable().default(null),
});

const departmentSchema = z.object({
    departmentId: z.number(),
    displayName: z.string(),
});

export const departmentsResponseSchema = z.object({
    departments: z.array(departmentSchema),
});
