import Redis from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import { config } from "../config/env-config";

let redisClient: RedisClient | null = null;
const MAX_CONNECTION_RETRIES = 5;
const RETRY_INTERVAL_MS = 2000;

export const initializeRedis = async (): Promise<void> => {
  let retries = 0;
  while (retries < MAX_CONNECTION_RETRIES) {
    try {
      redisClient = new Redis(config.redisUrl);
      await redisClient.ping();
      console.log("Redis connection successful");
      return;
    } catch (err) {
      retries++;
      if (retries >= MAX_CONNECTION_RETRIES) {
        console.error("FATAL: Could not connect to Redis. Exiting.");
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, RETRY_INTERVAL_MS));
    }
  }
};

const getClient = (): RedisClient => {
    if (!redisClient) throw new Error("Redis client has not been initialized.");
    return redisClient;
};

export const setCache = async (key: string, value: string, expirationInSeconds: number = 3600 * 16): Promise<void> => {
    const client = getClient();
    await client.set(key, value, 'EX', expirationInSeconds);
};

export const getCache = async (key: string): Promise<string | null> => {
    const client = getClient();
    return await client.get(key);
};

export const deleteCache = async (key: string): Promise<void> => {
    const client = getClient();
    await client.del(key);
};