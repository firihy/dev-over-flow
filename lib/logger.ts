import "server-only";

import pino from "pino";

// Pretty output needs worker threads, which the edge runtime lacks.
// pino-pretty is a dev dependency, so production always logs JSON lines.
const usePrettyOutput =
  process.env.NODE_ENV !== "production" && process.env.NEXT_RUNTIME !== "edge";

// Levels: debug < info < warn < error. LOG_LEVEL hides the levels below it.
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: usePrettyOutput
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
