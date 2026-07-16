import { TemplateException } from "../errors/email-exceptions";

export class TemplateEngine {
  private static getBaseLayout(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #2563eb; padding: 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .button:hover { background-color: #1d4ed8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IndiWebPros LMS. All rights reserved.</p>
            <p>If you did not request this email, please ignore it.</p>
        </div>
    </div>
</body>
</html>`;
  }

  static render(templateName: string, data: Record<string, unknown>): { html: string; subject: string } {
    try {
      let content = "";
      let subject = "";

      switch (templateName) {
        case "verification":
          subject = "Verify your email address - IndiWebPros";
          content = `
            <h2>Welcome to IndiWebPros, {{name}}!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{{verificationLink}}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{{verificationLink}}">{{verificationLink}}</a></p>
          `;
          break;

        case "password-reset":
          subject = "Password Reset Request - IndiWebPros";
          content = `
            <h2>Password Reset</h2>
            <p>Hello {{name}},</p>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <div style="text-align: center;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
            </div>
            <p>If you did not request this, you can safely ignore this email.</p>
          `;
          break;

        case "welcome":
          subject = "Welcome to IndiWebPros LMS!";
          content = `
            <h2>Welcome aboard, {{name}}!</h2>
            <p>We are thrilled to have you join our learning community.</p>
            <p>You can now browse our catalog of enterprise courses and begin your learning journey.</p>
            <div style="text-align: center;">
                <a href="{{dashboardLink}}" class="button">Go to Dashboard</a>
            </div>
          `;
          break;

        case "purchase-confirmation":
          subject = "Purchase Confirmation - IndiWebPros";
          content = `
            <h2>Thank you for your purchase!</h2>
            <p>Hi {{name}},</p>
            <p>Your enrollment in <strong>{{courseName}}</strong> was successful.</p>
            <p>Order ID: {{orderId}}</p>
            <div style="text-align: center;">
                <a href="{{courseLink}}" class="button">Start Learning</a>
            </div>
          `;
          break;

        case "certificate-issued":
          subject = "Congratulations! Your Certificate is Ready";
          content = `
            <h2>Congratulations, {{name}}!</h2>
            <p>You have successfully completed <strong>{{courseName}}</strong>.</p>
            <p>Your official certificate of completion is now available.</p>
            <div style="text-align: center;">
                <a href="{{certificateLink}}" class="button">View Certificate</a>
            </div>
          `;
          break;

        case "notification":
          subject = "{{subject}}";
          content = `
            <h2>Hello {{name}},</h2>
            <p>{{message}}</p>
            <div style="text-align: center;">
                <a href="{{actionLink}}" class="button">{{actionText}}</a>
            </div>
          `;
          break;

        default:
          throw new Error(`Template not found: ${templateName}`);
      }

      // Replace placeholders
      let finalHtml = this.getBaseLayout(content, subject);
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        const safeValue = String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;"); // XSS escaping
        finalHtml = finalHtml.replace(regex, safeValue);
        subject = subject.replace(regex, safeValue);
      }

      return { html: finalHtml, subject };
    } catch (error) {
      throw new TemplateException(`Failed to render template ${templateName}`, [error]);
    }
  }
}
