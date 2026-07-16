import { TemplateEngine } from "../templates/template-engine";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function run() {
  console.log("🌱 Running Email Module Template tests...");

  try {
    // Test 1: Verification Template Rendering
    const verificationRender = TemplateEngine.render("verification", {
      name: "JohnDoe",
      verificationLink: "https://test.com/verify",
    });
    
    assert(verificationRender.subject.includes("Verify your email address"), "Subject contains correct Verification phrasing");
    assert(verificationRender.html.includes("JohnDoe"), "HTML body replaces {{name}} with JohnDoe");
    assert(verificationRender.html.includes("https://test.com/verify"), "HTML body injects verificationLink");
    assert(verificationRender.html.includes("<!DOCTYPE html>"), "HTML contains base HTML layout wrappers");
    
    // Test 2: XSS Injection escape check
    const xssRender = TemplateEngine.render("notification", {
      subject: "Test",
      name: "<script>alert('xss')</script>",
      message: "Test message",
      actionLink: "http://link",
      actionText: "Click",
    });
    
    assert(!xssRender.html.includes("<script>alert('xss')</script>"), "HTML escapes raw HTML injection tags");
    assert(xssRender.html.includes("&lt;script&gt;alert('xss')&lt;/script&gt;"), "HTML converted injection tags to safe characters");

    // Test 3: Password Reset Template
    const resetRender = TemplateEngine.render("password-reset", {
      name: "Jane",
      resetLink: "https://test.com/reset",
    });
    
    assert(resetRender.subject.includes("Password Reset Request"), "Subject contains Password Reset text");
    assert(resetRender.html.includes("Jane"), "HTML body replaces {{name}} with Jane");

    console.log("\n🎉 All email template rendering and validation tests passed successfully!");
  } catch (error) {
    console.error("❌ Test run failed:", error);
    process.exit(1);
  }
}

run();
