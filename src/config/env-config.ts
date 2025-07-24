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

function requireNumberEnv(name: string): number {
    const value = requireEnv(name);
    const num = Number(value);
    if (isNaN(num)) {
        console.error(`FATAL: Environment variable ${name} must be a valid number. Received: "${value}"`);
        process.exit(1);
    }
    return num;
}

export const config = {
    port: requireNumberEnv("PORT"),
    serviceBaseUrl: requireEnv("SERVICE_BASE_URL"),
    redisUrl: requireEnv("REDIS_URL"),
    amqpConnectionString: requireEnv("AMQP_CONNECTION_STRING"),
    amqpExchangeName: requireEnv("AMQP_EXCHANGE_NAME"),
    
    db: {
        host: requireEnv("DB_HOST"),
        user: requireEnv("DB_USER"),
        password: process.env.DB_PASSWORD || '',
        database: requireEnv("DB_NAME"),
        port: requireNumberEnv("DB_PORT"),
    },
};