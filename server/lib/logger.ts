type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logger with timestamp and source tagging
 */
export function log(message: string, source = 'express', level: LogLevel = 'info'): void {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const prefix = `${formattedTime} [${source}]`;

  switch (level) {
    case 'error':
      console.error(`${prefix} ERROR: ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} WARN: ${message}`);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} DEBUG: ${message}`);
      }
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Log API request/response
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  responseBody?: unknown
): void {
  let logLine = `${method} ${path} ${statusCode} in ${durationMs}ms`;

  if (responseBody && process.env.NODE_ENV === 'development') {
    const bodyStr = JSON.stringify(responseBody);
    // Truncate long responses
    logLine += ` :: ${bodyStr.length > 200 ? bodyStr.slice(0, 200) + '...' : bodyStr}`;
  }

  log(logLine, 'api');
}

/**
 * Log error with optional stack trace
 */
export function logError(error: Error, context?: string): void {
  const message = context ? `${context}: ${error.message}` : error.message;
  log(message, 'error', 'error');

  if (process.env.NODE_ENV === 'development' && error.stack) {
    console.error(error.stack);
  }
}
