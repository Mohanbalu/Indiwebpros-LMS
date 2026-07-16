/**
 * Unified Test Runner for Observability Module
 * Milestone 25
 */

import { runHealthTests } from "./health.service.test";
import { runMetricsTests } from "./metrics.service.test";
import { runErrorTrackerTests } from "./error-tracker.test";
import { runCorrelationTests } from "./correlation.middleware.test";
import { runPerformanceTests } from "./performance.middleware.test";

async function main() {
  console.log("🚀 STARTING LMS OBSERVABILITY PLATFORM TESTS 🚀\n");

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    const health = await runHealthTests();
    totalPassed += health.passed;
    totalFailed += health.failed;

    const metrics = await runMetricsTests();
    totalPassed += metrics.passed;
    totalFailed += metrics.failed;

    const errorTracker = await runErrorTrackerTests();
    totalPassed += errorTracker.passed;
    totalFailed += errorTracker.failed;

    const correlation = await runCorrelationTests();
    totalPassed += correlation.passed;
    totalFailed += correlation.failed;

    const performance = await runPerformanceTests();
    totalPassed += performance.passed;
    totalFailed += performance.failed;

    console.log("\n" + "=" .repeat(50));
    console.log(`📊 FINAL RESULT: ${totalPassed} passed, ${totalFailed} failed`);
    console.log("=" .repeat(50));

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      console.log("\n🎉 ALL OBSERVABILITY MODULE TESTS PASSED SUCCESSFULLY! 🎉\n");
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Test execution failed with error:", err);
    process.exit(1);
  }
}

main();
