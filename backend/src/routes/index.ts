import { Router } from "express";
import { observabilityRouter } from "@/modules/observability";
import swaggerRouter from "./swagger";
import authRouter from "./auth.routes";
import storageRouter from "./storage.routes";
import emailRouter from "./email.routes";
import notificationRouter from "./notification.routes";
import categoryRouter from "../modules/course/routes/category.routes";
import courseRouter from "../modules/course/routes/course.routes";
import purchaseRouter from "../modules/enrollment/routes/purchase.routes";
import paymentRouter from "../modules/enrollment/routes/payment.routes";
import { enrollmentRouter, myCoursesRouter, adminEnrollmentRouter } from "../modules/enrollment/routes/enrollment.routes";
import playerRouter from "../modules/player/routes/player.routes";
import quizRouter from "../modules/assessment/routes/quiz.routes";
import assignmentRouter from "../modules/assessment/routes/assignment.routes";
import bankRouter from "../modules/assessment/routes/bank.routes";
import certificateRouter from "../modules/certificate/routes/certificate.routes";

import dashboardRouter from "../modules/dashboard/routes/dashboard.routes";
import instructorDashboardRouter from "../modules/dashboard/routes/instructor-dashboard.routes";
import mentorDashboardRouter from "../modules/dashboard/routes/mentor-dashboard.routes";
import adminDashboardRouter from "../modules/dashboard/routes/admin-dashboard.routes";

const apiRouter = Router();

// Observability: /health, /health/live, /health/ready, /health/startup, /metrics
apiRouter.use(observabilityRouter);
apiRouter.use(swaggerRouter);

// Skeletons for future endpoints
const placeholderRouter = (moduleName: string) => {
  const router = Router();
  router.all("*", (_req, res) => {
    res.status(501).json({
      success: false,
      message: `API endpoints for module [${moduleName}] are not implemented yet.`,
    });
  });
  return router;
};

apiRouter.use("/auth", authRouter);
apiRouter.use("/storage", storageRouter);
apiRouter.use("/email", emailRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/courses", courseRouter);
apiRouter.use("/purchases", purchaseRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/enrollments", enrollmentRouter);
apiRouter.use("/my/courses", myCoursesRouter);
apiRouter.use("/admin/enrollments", adminEnrollmentRouter);
apiRouter.use("/player", playerRouter);
apiRouter.use("/quizzes", quizRouter);
apiRouter.use("/assignments", assignmentRouter);
apiRouter.use("/bank", bankRouter);
apiRouter.use("/certificates", certificateRouter);
apiRouter.use("/dashboard/student", dashboardRouter);
apiRouter.use("/dashboard/instructor", instructorDashboardRouter);
apiRouter.use("/dashboard/mentor", mentorDashboardRouter);
apiRouter.use("/users", placeholderRouter("users"));
apiRouter.use("/admin", adminDashboardRouter);

export default apiRouter;
