import { RoleType } from "@prisma/client";

// Predefined test fixtures matching validation rules
export const Fixtures = {
  // Test User Inputs
  users: {
    student: {
      email: "student@indiwebpros.in",
      password: "Password@123",
      firstName: "Alex",
      lastName: "Student",
      role: RoleType.STUDENT,
    },
    instructor: {
      email: "instructor@indiwebpros.in",
      password: "Password@123",
      firstName: "Bob",
      lastName: "Instructor",
      role: RoleType.INSTRUCTOR,
    },
    mentor: {
      email: "mentor@indiwebpros.in",
      password: "Password@123",
      firstName: "Charlie",
      lastName: "Mentor",
      role: RoleType.MENTOR,
    },
    admin: {
      email: "admin@indiwebpros.in",
      password: "Password@123",
      firstName: "Diana",
      lastName: "Admin",
      role: RoleType.ADMIN,
    },
  },

  // Test Course Inputs
  courses: {
    nodeJsBasic: {
      title: "Node.js Basics for Beginners",
      description:
        "Learn Node.js core modules, event loop, and asynchronous programming in 10 hours of step-by-step videos.",
      price: 999.0,
    },
    reactAdvanced: {
      title: "Advanced React Patterns",
      description:
        "Master React Hooks, Context API, state machines, performance profiling, and component boundaries.",
      price: 2499.0,
    },
  },

  // Razorpay API Payload Fixtures
  razorpay: {
    webhookCaptured: {
      entity: "event",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: "pay_captured123",
            amount: 199900,
            currency: "INR",
            status: "captured",
            order_id: "order_rzp123",
            method: "netbanking",
            email: "student@indiwebpros.in",
            contact: "+919999999999",
          },
        },
      },
    },
    webhookFailed: {
      entity: "event",
      event: "payment.failed",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: "pay_failed123",
            amount: 199900,
            currency: "INR",
            status: "failed",
            order_id: "order_rzp123",
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Payment failed due to server error",
          },
        },
      },
    },
  },
};
