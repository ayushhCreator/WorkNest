/**
 * Utility functions for string formatting
 */

/**
 * Capitalizes the first letter of each word in a string
 * @param name - The name to capitalize
 * @returns The capitalized name
 */
export const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Gets initials from a name (first letter of first and last name)
 * @param name - The full name
 * @returns The initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Truncates a string to a specified length
 * @param str - The string to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export const truncate = (str: string, length: number): string => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
};
