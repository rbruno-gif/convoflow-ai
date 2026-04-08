/**
 * Validate channel name
 * @param {string} name - Channel name to validate
 * @returns {string|null} - Error message or null if valid
 */
export function validateChannelName(name) {
  if (!name || !name.trim()) {
    return 'Channel name is required';
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return 'Channel name cannot be empty';
  }

  if (trimmed.length > 80) {
    return 'Channel name must be 80 characters or less';
  }

  // Allow letters, numbers, hyphens, and underscores only
  const validNameRegex = /^[a-z0-9_-]+$/;
  if (!validNameRegex.test(trimmed.toLowerCase())) {
    return 'Channel name can only contain letters, numbers, hyphens, and underscores';
  }

  return null;
}

/**
 * Normalize channel name to lowercase with hyphens
 * @param {string} name - Channel name to normalize
 * @returns {string} - Normalized name
 */
export function normalizeChannelName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

/**
 * Check if channel name already exists
 * @param {Array} existingChannels - List of existing channels
 * @param {string} name - Channel name to check
 * @returns {boolean} - True if name exists
 */
export function channelNameExists(existingChannels, name) {
  const normalizedName = normalizeChannelName(name);
  return existingChannels.some(c => c.name === normalizedName);
}