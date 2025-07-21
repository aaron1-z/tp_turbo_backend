import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`FATAL: Missing required environment variable: ${name}`);
        process.exit(1);
    }
    return value;
}

export const config = {
    port: Number(process.env.PORT) || 3000,
    serviceBaseUrl: requireEnv("SERVICE_BASE_URL"),
    redisUrl: requireEnv("REDIS_URL")
};