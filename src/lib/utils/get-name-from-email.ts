/**
 * Extracts and formats a display name from an email address.
 * Takes the username part (before @), capitalizes the first character,
 * and capitalizes characters after separators (-, _, .).
 * Returns up to the first 2 words.
 * 
 * @param {string | null | undefined} email - The email address to extract name from
 * @param {string | null | undefined} fallbackText - Fallback text if email is not provided
 * @returns {string} Formatted name with proper capitalization (max 2 words)
 * 
 * @example
 * getNameFromEmail("john.doe@example.com") // Returns "John Doe"
 * getNameFromEmail("alice_smith@test.com") // Returns "Alice Smith"
 * getNameFromEmail("bob-jones@mail.com") // Returns "Bob Jones"
 * getNameFromEmail("sarah@example.com") // Returns "Sarah"
 * getNameFromEmail("") // Returns "Unknown"
 * getNameFromEmail(null, "Guest") // Returns "Guest"
 */
export function getNameFromEmail(email?: string | null, fallbackText?: string | null): string {
    const _email = email || fallbackText || "Unknown";

    // Extract username part (before @)
    const username = _email.split('@')[0];

    // Replace separators with spaces and split into words
    const words = username
        .replace(/[-_.]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .slice(0, 2); // Take max 2 words

    return words.join(' ');
}
