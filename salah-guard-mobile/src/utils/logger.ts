/**
 * Production-safe logger that strips log output in release builds.
 * Uses __DEV__ flag provided by React Native to determine build mode.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const noop = (): void => {};

const createLogger = (): Logger => {
  if (__DEV__) {
    return {
      debug: (...args: unknown[]) => console.debug('[SalahGuard]', ...args),
      info: (...args: unknown[]) => console.info('[SalahGuard]', ...args),
      warn: (...args: unknown[]) => console.warn('[SalahGuard]', ...args),
      error: (...args: unknown[]) => console.error('[SalahGuard]', ...args),
    };
  }

  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
};

const logger = createLogger();

export default logger;
