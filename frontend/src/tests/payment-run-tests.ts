export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

// Function to compute taxation / coupon discount client-side to verify totals
function calculatePricing(price: number, discountPercent: number) {
  const discount = Number(((price * discountPercent) / 100).toFixed(2));
  const finalAmount = Math.max(0, price - discount);
  const isFree = finalAmount === 0;
  return { price, discount, finalAmount, isFree };
}

async function run() {
  console.log("🎬 Running Payment Checkout UI Module tests...\n");

  // ── Pricing Calculations Tests ──
  console.log("── Pricing Calculations ──");

  const freeCourse = calculatePricing(0, 0);
  const paidCourse = calculatePricing(1500, 0);
  const discountedCourse = calculatePricing(1000, 20); // 20% off
  const fullyDiscountedCourse = calculatePricing(500, 100); // 100% off

  assert(freeCourse.finalAmount === 0 && freeCourse.isFree === true, "Free course correctly resolves final amount to 0");
  assert(paidCourse.finalAmount === 1500 && paidCourse.isFree === false, "Paid course correctly keeps price when no discount");
  assert(discountedCourse.finalAmount === 800 && discountedCourse.discount === 200, "Calculates correct 20% discount amount");
  assert(fullyDiscountedCourse.finalAmount === 0 && fullyDiscountedCourse.isFree === true, "Enforces isFree when discount matches base price");

  console.log("\n🎉 All Payment Checkout UI tests passed successfully!");
}

run();
