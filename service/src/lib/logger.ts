import pino, { Logger } from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Pino logger instance
 * Configured with pretty print for development
 */
export const logger: Logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

/**
 * Legacy logger wrapper for backward compatibility
 * @deprecated Use logger.info(), logger.warn(), logger.error() directly
 */
export const legacyLogger = {
  info: (message: string) => logger.info(message),
  warn: (message: string) => logger.warn(message),
  error: (message: string) => logger.error(message),
};

export default logger;
