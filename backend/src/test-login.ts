import { AuthService } from "./services/auth.service";

async function main() {
  console.log("🎬 Simulating AuthService.login for 'test@indiwebpros.com'...");
  try {
    const result = await AuthService.login({
      email: "test@indiwebpros.com",
      password: "Password@123"
    });
    console.log("✅ Simulating login SUCCESS! Result:", result);
  } catch (error: any) {
    console.error("❌ Simulating login FAILED:", {
      message: error.message,
      name: error.name,
      statusCode: error.statusCode,
      stack: error.stack
    });
  }
}

main();
