const isDebug = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.NODE_ENV === 'development';

type AnyFunction = (...args: unknown[]) => void;

const make = (fn: AnyFunction): AnyFunction => {
  return (...args: unknown[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(...args);
    } catch (err) {
      // Swallow errors thrown by console to avoid breaking app
    }
  };
};

export const logger = {
  // Allow console.debug/info here for development logs
  // eslint-disable-next-line no-console
  debug: isDebug ? make(console.debug.bind(console)) : () => {},
  // eslint-disable-next-line no-console
  info: isDebug ? make(console.info.bind(console)) : () => {},
  warn: make(console.warn.bind(console)),
  error: make(console.error.bind(console)),
};

export default logger;
