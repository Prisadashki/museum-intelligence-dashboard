import type {z} from 'zod';
import type {rawMetObjectSchema, searchResponseSchema, departmentsResponseSchema} from '@/api/schemas';

export type RawMetObject = z.infer<typeof rawMetObjectSchema>;
export type RawSearchResponse = z.infer<typeof searchResponseSchema>;
export type RawDepartmentsResponse = z.infer<typeof departmentsResponseSchema>;
