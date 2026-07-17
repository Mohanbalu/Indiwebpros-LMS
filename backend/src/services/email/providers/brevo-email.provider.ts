import { EmailConfig } from "../../shared/config.schema";
import { BaseSMTPEmailProvider } from "./base-smtp-email.provider";

export class BrevoSMTPProvider extends BaseSMTPEmailProvider {
  constructor(config: EmailConfig) {
    super(config, "BrevoSMTPProvider", "brevo", "Brevo");
  }
}