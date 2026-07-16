export const TEST_CONFIG = {
  dbTestUrl:
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/indiwebpros_lms_test?schema=public",
  testPort: 5001,
  runTimeout: 10000,
};
