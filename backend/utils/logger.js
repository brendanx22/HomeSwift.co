// Enhanced logging utility for the backend
const log = (message, data = "") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || "");
};

const errorLog = (message, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error?.message || error);
  if (error?.stack) {
    console.error(error.stack);
  }
};

const warnLog = (message, data = "") => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] WARN: ${message}`, data || "");
};

const infoLog = (message, data = "") => {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}] INFO: ${message}`, data || "");
};

module.exports = {
  log,
  errorLog,
  warnLog,
  infoLog
};
