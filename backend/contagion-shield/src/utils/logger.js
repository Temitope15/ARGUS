/**
 * Logger utility - Configures pino for structured logging.
 */
import pino from 'pino';
import config from '../config/index.js';

const transport = config.env === 'development' 
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

const logger = pino({
  level: config.logLevel,
  base: {
    env: config.env,
  },
}, transport);

// Custom method to create child loggers with module name
export const createLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

export default logger;
