import * as redis from "./redis";

interface HealthReport {
  isHealthy: boolean;
  dependencies: {
    redis: boolean;
  }
}

export const createHealthReport = async (): Promise<HealthReport> => {
  const redisIsHealthy = await redis.isHealthy();
    
  const signerIsHealthy = redisIsHealthy;

  const healthReport = {
    isHealthy: signerIsHealthy,
    dependencies: {
      redis: redisIsHealthy
    }
  };

  return healthReport;
}