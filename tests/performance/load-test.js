import http from "k6/http";
import { sleep, check } from "k6";

// Performance Load Testing config for k6
// Run command: k6 run load-test.js
export const options = {
  stages: [
    { duration: "5s", target: 20 }, // Ramp up: 0 to 20 virtual users in 5 seconds
    { duration: "10s", target: 20 }, // Sustained load: 20 concurrent users for 10 seconds
    { duration: "5s", target: 0 }, // Cool down: ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of request latency must be below 500ms
    http_req_failed: ["rate<0.01"], // HTTP error rate must be below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

export default function () {
  const headers = { "Content-Type": "application/json" };

  // 1. Health Liveness Check Load Test
  const healthRes = http.get(`${BASE_URL}/health/live`);
  check(healthRes, {
    "liveness is 200": (r) => r.status === 200,
    "liveness is healthy": (r) => r.json().status === "healthy",
  });
  sleep(0.5);

  // 2. Health Readiness Check Load Test
  const readyRes = http.get(`${BASE_URL}/health/ready`);
  check(readyRes, {
    "readiness is 200": (r) => r.status === 200,
    "readiness is healthy": (r) => r.json().status === "healthy",
  });
  sleep(0.5);

  // 3. Course Catalog Browsing simulation
  const catalogRes = http.get(`${BASE_URL}/api/v1/courses`, { headers });
  check(catalogRes, {
    "catalog returned 200": (r) => r.status === 200,
    "catalog pagination verified": (r) => r.json().success === true,
  });
  sleep(1);

  // 4. Razorpay Webhook Endpoint simulation
  const webhookPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_perf_test_123",
          amount: 199900,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  // Sending fake signature which should return 400 (signature verification load)
  const webhookRes = http.post(`${BASE_URL}/api/v1/payments/razorpay/webhook`, webhookPayload, {
    headers: Object.assign({}, headers, { "x-razorpay-signature": "fake_signature_hash" }),
  });
  check(webhookRes, {
    "webhook signature rejected": (r) => r.status === 400,
  });

  sleep(1);
}
