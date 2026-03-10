import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: any) => {
      const { timestamp, level, message, ...args } = info;
      const ts = (timestamp as string).slice(0, 19).replace('T', ' ');
      const content = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
      const extra = Object.keys(args).length ? `\n${JSON.stringify(args, null, 2)}` : '';
      return `${ts} ${level}: ${content}${extra}`;
    }
  ),
);

const transports = [
  new winston.transports.Console(),
];

const activeLevel = level();
const logger = winston.createLogger({
  level: activeLevel,
  levels,
  format,
  transports,
});

// Initial log to confirm initialization and level
console.log(`[Logger] Initialized with level: ${activeLevel}`);

export default logger;
