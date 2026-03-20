import {useState, useEffect, useRef} from 'react';

const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Custom hook for debounced input.
 * Input changes are committed to external state after debounce.
 * External state changes are synced back to local input (e.g., browser back/forward).
 *
 * @param externalValue - The current value from external state (e.g., URL params)
 * @param onCommit - Callback to update external state when debounce completes
 * @param debounceMs - Debounce delay in milliseconds (default: 400ms)
 * @returns Tuple of [localValue, setLocalValue] for controlled input
 */
export function useDebouncedInput(
    externalValue: string,
    onCommit: (value: string) => void,
    debounceMs: number = DEFAULT_DEBOUNCE_MS,
) {
    const [localValue, setLocalValue] = useState(externalValue);
    // Track the last value we committed to know if external changes came from us
    const lastCommittedRef = useRef(externalValue);

    // Sync external changes back to local state (e.g., browser navigation, reset).
    // This is a legitimate use of setState in an effect: we're synchronizing with
    // an external source (URL/router state) that changed independently.
    useEffect(() => {
        // Only sync if external value changed AND it wasn't from our commit
        if (externalValue !== localValue && externalValue !== lastCommittedRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with external URL state (browser navigation)
            setLocalValue(externalValue);
            lastCommittedRef.current = externalValue;
        }
    }, [externalValue, localValue]);

    // Debounced commit to external state
    useEffect(() => {
        if (localValue === externalValue) {
            return;
        }

        const timer = setTimeout(() => {
            lastCommittedRef.current = localValue;
            onCommit(localValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localValue, externalValue, onCommit, debounceMs]);

    return [localValue, setLocalValue] as const;
}
