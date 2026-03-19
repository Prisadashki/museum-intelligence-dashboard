import type {RawDepartmentsResponse} from '@/types/api';
import type {Department} from '@/types/artwork';

export function transformDepartments(raw: RawDepartmentsResponse): Department[] {
    return raw.departments.map((dept) => ({
        id: dept.departmentId,
        name: dept.displayName,
    }));
}
