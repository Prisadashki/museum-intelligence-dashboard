import {useQuery} from '@tanstack/react-query';
import {getObject} from '@/api/endpoints';
import {transformRawObject} from '@/transformers/artwork';
import {ARTWORK_STALE_TIME, ARTWORK_GC_TIME} from '@/utils/constants';

export function useArtwork(objectId: number) {
    return useQuery({
        queryKey: ['artwork', objectId],
        queryFn: async ({signal}) => {
            const raw = await getObject(objectId, {signal});
            return transformRawObject(raw);
        },
        staleTime: ARTWORK_STALE_TIME,
        gcTime: ARTWORK_GC_TIME,
        enabled: objectId > 0,
    });
}
