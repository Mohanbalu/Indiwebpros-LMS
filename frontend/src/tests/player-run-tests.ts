export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

// 1. Helper to calculate sequential locks
function calculateLocks(lessons: { id: string; completed: boolean }[]) {
  const unlocked = new Set<string>();
  let allPreviousCompleted = true;
  lessons.forEach((l, idx) => {
    if (idx === 0 || allPreviousCompleted) {
      unlocked.add(l.id);
    }
    if (!l.completed) {
      allPreviousCompleted = false;
    }
  });
  return unlocked;
}

// 2. Video completion threshold check
function isVideoCompleted(position: number, duration: number) {
  return (position / duration) >= 0.90;
}

async function run() {
  console.log("🎬 Running Course Player UI Module tests...\n");

  // -- Test 1: Sequential Locking --
  const lessonsSample = [
    { id: "l1", completed: true },
    { id: "l2", completed: false },
    { id: "l3", completed: false },
  ];
  const unlockedSet = calculateLocks(lessonsSample);
  assert(unlockedSet.has("l1"), "First lesson is unlocked by default");
  assert(unlockedSet.has("l2"), "Second lesson is unlocked since first is completed");
  assert(!unlockedSet.has("l3"), "Third lesson is locked because second is incomplete");

  // -- Test 2: Video Progress Completion Threshold --
  assert(isVideoCompleted(89, 100) === false, "Video incomplete at 89% watch duration");
  assert(isVideoCompleted(90, 100) === true, "Video complete at 90% watch duration");
  assert(isVideoCompleted(95, 100) === true, "Video complete at 95% watch duration");

  console.log("\n🎉 All Course Player UI tests passed successfully!");
}

run();
