export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

function computePasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  let label = "Too Weak";
  if (score === 5) {
    label = "Strong Choice!";
  } else if (score >= 3) {
    label = "Good";
  }
  return { score, label };
}

function getRoleRedirect(role: string): string {
  if (role === "Admin") return "/admin";
  if (role === "Instructor") return "/instructor";
  if (role === "Mentor") return "/mentor";
  return "/student";
}

async function run() {
  console.log("🎬 Running Authentication UI Module tests...\n");

  // ── Password Strength calculations ──
  console.log("── Password Strength Calculations ──");
  
  const weakPassword = computePasswordStrength("123");
  const mediumPassword = computePasswordStrength("Stronger1");
  const strongPassword = computePasswordStrength("VeryStrongP@ss1");

  assert(weakPassword.label === "Too Weak" && weakPassword.score === 1, "Correctly tags weak simple password");
  assert(mediumPassword.label === "Good" && mediumPassword.score === 4, "Correctly tags good medium password");
  assert(strongPassword.label === "Strong Choice!" && strongPassword.score === 5, "Correctly tags strong password");

  // ── Role Redirect Mappings ──
  console.log("\n── Role Redirect Mapping Checks ──");
  
  assert(getRoleRedirect("Admin") === "/admin", "Redirects Admin to /admin");
  assert(getRoleRedirect("Instructor") === "/instructor", "Redirects Instructor to /instructor");
  assert(getRoleRedirect("Mentor") === "/mentor", "Redirects Mentor to /mentor");
  assert(getRoleRedirect("Student") === "/student", "Redirects Student to /student");
  assert(getRoleRedirect("Guest") === "/student", "Fallback redirects other role to /student");

  console.log("\n🎉 All Authentication UI tests passed successfully!");
}

run();
