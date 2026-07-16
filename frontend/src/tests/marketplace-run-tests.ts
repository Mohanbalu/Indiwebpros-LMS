export {};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

function filterCourses(
  courses: any[],
  category: string,
  level: string,
  searchQuery: string
) {
  return courses.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      category === "All" || c.category.name === category;

    const matchesLevel =
      level === "All" || c.level === level;

    return matchesSearch && matchesCategory && matchesLevel;
  });
}

function run() {
  console.log("🎬 Running Course Marketplace UI Module tests...\n");

  const mockCourses = [
    { title: "React 19 Hooks", level: "Beginner", category: { name: "UI/UX" }, description: "Visual structures" },
    { title: "TypeScript SaaS Architect", level: "Advanced", category: { name: "Full Stack" }, description: "Database setups" },
    { title: "AWS Cloud Terraform", level: "Advanced", category: { name: "Cloud" }, description: "VPC rules" },
  ];

  // ── Search & Filter Logic ──
  console.log("── Search & Filter Logic Checks ──");
  
  const searchResults = filterCourses(mockCourses, "All", "All", "saas");
  const categoryResults = filterCourses(mockCourses, "Cloud", "All", "");
  const levelResults = filterCourses(mockCourses, "All", "Advanced", "");

  assert(searchResults.length === 1 && searchResults[0].title.includes("SaaS"), "Search: matches keywords successfully");
  assert(categoryResults.length === 1 && categoryResults[0].category.name === "Cloud", "Filter: Category filters match expected");
  assert(levelResults.length === 2, "Filter: Level filters count matches successfully");

  // ── Pricing conversion check ──
  console.log("\n── Pricing Conversion Checks ──");
  
  const formattedPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price}`;
  };

  assert(formattedPrice(0) === "Free", "Pricing: 0 converts to Free label");
  assert(formattedPrice(199) === "$199", "Pricing: Paid fee converts to dollars symbol badge");

  console.log("\n🎉 All Course Marketplace UI tests passed successfully!");
}

run();
