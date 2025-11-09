/**
 * Extracts initials from a name for avatar display.
 * Returns up to 2 uppercase characters from the provided name.
 * If no name is provided, returns "U" for "Unknown".
 * 
 * @param {string | null | undefined} name - The name to extract initials from
 * @returns {string} Uppercase initials (max 2 characters)
 * 
 * @example
 * getAvatarInitial("John Doe") // Returns "JD"
 * getAvatarInitial("Alice") // Returns "AL"
 * getAvatarInitial("") // Returns "U"
 * getAvatarInitial(null) // Returns "U"
 */
export function getAvatarInitial(name?: string | null): string {
  const _name = name || "Unknown";

  // Split by spaces and take first letter of first two words
  const words = _name.trim().split(/\s+/);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // If single word, take first 2 characters
  return _name.slice(0, 1).toUpperCase();
}
