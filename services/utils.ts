/**
 * Get current completion period for checklist (monthly or weekly)
 * @param frequency 
 * @returns completion period string (e.g., "month-2025-08" or "week-2025-W31")
 */
export const getCurrentPeriod = (frequency: string): string => {
    // Get current date 
    const now = new Date();
    // IF the frequency for recurring task is monthly
    if (frequency == "monthly") {
        // Return completion period in monthly format e.g "month-2025-08"
        return `month-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    // IF the frequency of recurring task is weekly
    if (frequency == "weekly") {
        // Return completion period in weekly format e.g "week-2025-W31"
        const week = getISOWeekNumber(now);
        return `week-${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    return "";
}

/**
 * Get ISO week number for a given date.
 * @param date 
 * @returns ISO week number.
 */
export const getISOWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

