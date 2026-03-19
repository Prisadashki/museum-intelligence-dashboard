/**
 * Formats a single year for display.
 * Handles BCE (negative numbers), CE, null, and the historical year 0 case.
 *
 * Examples:
 *   1200  → "1200 CE"
 *   -500  → "500 BCE"
 *   null  → "Date unknown"
 *   0     → "1 BCE" (there is no year 0 historically)
 */
export function formatYear(year: number | null): string {
    if (year == null) return 'Date unknown';

    if (year === 0) return '1 BCE';

    if (year < 0) {
        return `${Math.abs(year)} BCE`;
    }

    return `${year} CE`;
}

/**
 * Formats a year range for display.
 *
 * Rules:
 *   - Same year → single year display (e.g. "1200 CE")
 *   - Cross-era → "100 BCE – 100 CE"
 *   - Same era  → "1200–1250 CE" or "500–450 BCE"
 *   - If either null, fall back to the available year via formatYear
 *   - Both null → "Date unknown"
 */
export function formatYearRange(from: number | null, to: number | null): string {
    if (from == null && to == null) return 'Date unknown';
    if (from == null) return formatYear(to);
    if (to == null) return formatYear(from);
    if (from === to) return formatYear(from);

    const fromIsNegativeOrZero = from <= 0;
    const toIsNegativeOrZero = to <= 0;

    // Cross-era: one is BCE (negative or 0) and the other is CE (positive)
    if (fromIsNegativeOrZero && !toIsNegativeOrZero) {
        return `${formatYear(from)} \u2013 ${formatYear(to)}`;
    }

    // Both BCE
    if (fromIsNegativeOrZero && toIsNegativeOrZero) {
        const fromDisplay = from === 0 ? 1 : Math.abs(from);
        const toDisplay = to === 0 ? 1 : Math.abs(to);
        return `${fromDisplay}\u2013${toDisplay} BCE`;
    }

    // Both CE (both positive)
    return `${from}\u2013${to} CE`;
}
