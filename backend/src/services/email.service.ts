import { ServiceContainer } from "@/services/shared/service-container";
import { InfrastructureConfig } from "@/services/shared/config.schema";
import { createEmailProvider } from "@/services/shared/service-factory";
import { IEmailService } from "@/services/email";

class EmailService {
  private providerPromise: Promise<IEmailService> | null = null;

  private async getProvider(): Promise<IEmailService> {
    try {
      return ServiceContainer.email;
    } catch {
      if (!this.providerPromise) {
        this.providerPromise = (async () => {
          const config = InfrastructureConfig.load();
          const provider = createEmailProvider(config.email);
          await provider.initialize();
          return provider;
        })();
      }

      return this.providerPromise;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const provider = await this.getProvider();
    await provider.sendVerification(email, token);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const provider = await this.getProvider();
    await provider.sendPasswordReset(email, token);
  }
}

export const emailService = new EmailService();
