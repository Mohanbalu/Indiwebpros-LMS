import { prisma } from "./client";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";

export class DatabaseProvider {
  private static retryCount = 0;
  private static maxRetries = 5;
  private static delayMs = 3000;

  static async connect(): Promise<void> {
    try {
      logger.info("Connecting to PostgreSQL database via Prisma...");
      await prisma.$connect();
      logger.info("Successfully connected to the database!");
    } catch (error) {
      logger.error(error as Error, "Failed to connect to the database");
      this.retryCount++;
      if (this.retryCount < this.maxRetries) {
        logger.info(
          `Retrying database connection in ${this.delayMs / 1000}s (${this.retryCount}/${this.maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        return this.connect();
      } else {
        logger.error("Database connection retries exhausted.");
        if (env.NODE_ENV === "production") {
          process.exit(1);
        }
      }
    }
  }

  static async disconnect(): Promise<void> {
    try {
      logger.info("Disconnecting Prisma database client...");
      await prisma.$disconnect();
      logger.info("Database client disconnected successfully.");
    } catch (error) {
      logger.error(error as Error, "Error disconnecting database client");
    }
  }
}
