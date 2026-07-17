import { EmailConfig } from "../../shared/config.schema";
import { BaseSMTPEmailProvider } from "./base-smtp-email.provider";

export class SMTPProvider extends BaseSMTPEmailProvider {
  constructor(config: EmailConfig) {
    super(config, "SMTPProvider", "smtp", "SMTP");
  }
}
