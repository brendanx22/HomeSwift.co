/**
 * Utility functions for agent ID management
 */

/**
 * Generates a unique agent ID for a user
 * Format: AGT + timestamp (6 digits) + random number (4 digits)
 * Example: AGT2301011234
 */
export const generateAgentId = () => {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4-digit random number
  return `AGT${timestamp}${random}`;
};

/**
 * Validates if a string is a valid agent ID format
 */
export const isValidAgentId = (agentId) => {
  const agentIdRegex = /^AGT\d{10}$/;
  return agentIdRegex.test(agentId);
};

/**
 * Generates a unique agent ID and ensures it's not already taken
 * This function would typically check against a database
 */
export const generateUniqueAgentId = async () => {
  // For now, we'll generate IDs and assume they're unique
  // In a real application, you'd want to check against a database
  let agentId;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    agentId = generateAgentId();
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique agent ID after maximum attempts');
    }
  } while (await isAgentIdTaken(agentId));

  return agentId;
};

/**
 * Checks if an agent ID is already taken (placeholder for database check)
 */
export const isAgentIdTaken = async (agentId) => {
  // This would typically query a database to check if the agent ID exists
  // For now, we'll simulate this with a simple check
  // In a real application, you'd implement proper database validation
  return false; // Assume all generated IDs are unique for now
};
