import fs from 'fs';
import path from 'path';
import pino, { Logger, LoggerOptions } from 'pino';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

export function createLogger(moduleName: string): Logger {
    const logFilePath = path.join(logDir, `${moduleName.toLowerCase()}.log`);
    const pinoOptions: LoggerOptions = {
        name: moduleName,
        level: 'info', 
    };

    const transport = pino.transport({
        targets: [
            {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', 
                    ignore: 'pid,hostname,name', 
                    messageFormat: `[{name}] {msg}` 
                }
            },
            {
                target: 'pino/file',
                level: 'info', 
                options: { destination: logFilePath }
            }
        ]
    });

    return pino(pinoOptions, transport);
}