/**
 * Format Date
 * @param dateStr 
 * @returns 
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format active range
 * @param from 
 * @param to 
 * @returns 
 */
export const formatActiveRange = (from: string, to: string): string => {
  if (from === to) {
    return formatDate(from);
  }
  return `${formatDate(from)} - ${formatDate(to)}`;
}