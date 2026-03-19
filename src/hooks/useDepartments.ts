import {useQuery} from '@tanstack/react-query';
import {getDepartments} from '@/api/endpoints';
import {transformDepartments} from '@/transformers/department';
import {DEPARTMENTS_STALE_TIME, DEPARTMENTS_GC_TIME} from '@/utils/constants';

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const raw = await getDepartments();
            return transformDepartments(raw);
        },
        staleTime: DEPARTMENTS_STALE_TIME,
        gcTime: DEPARTMENTS_GC_TIME,
    });
}
