const logLevel = process.env.LOG_LEVEL || 'info';

const colors = {
  info: '\x1b[36m',  // Cyan
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

export const logger = {
  info: (message: string) => {
    if (['info', 'warn', 'error'].includes(logLevel)) {
      console.log(`${colors.info}[INFO]${colors.reset} ${message}`);
    }
  },
  warn: (message: string) => {
    if (['warn', 'error'].includes(logLevel)) {
      console.warn(`${colors.warn}[WARN]${colors.reset} ${message}`);
    }
  },
  error: (message: string) => {
    if (['error'].includes(logLevel)) {
      console.error(`${colors.error}[ERROR]${colors.reset} ${message}`);
    }
  },
};
