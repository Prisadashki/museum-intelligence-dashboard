import type {Department} from '@/types/artwork';

/**
 * Finds a department ID by name. Case-insensitive match.
 * Returns null if no match found.
 */
export function findDepartmentId(departmentName: string, departments: Department[]): number | null {
    const normalized = departmentName.toLowerCase();
    const dept = departments.find((d) => d.name.toLowerCase() === normalized);
    return dept?.id ?? null;
}
