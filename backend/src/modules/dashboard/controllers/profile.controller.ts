import { Request, Response, NextFunction } from "express";
import path from "path";
import { prisma } from "@/database/client";
import { EnrollmentStatus, PaymentStatus } from "@/generated/client";
import { ServiceContainer } from "@/services/shared/service-container";
import { NotFoundError, ValidationError } from "@/errors/custom-errors";
import { StorageValidator } from "@/services/storage/validators/storage.validator";

export class ProfileController {
  static async getProfileData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 1. Fetch Student User Details
      const student = await prisma.user.findUnique({
        where: { id: userId },
        include: { avatarFile: true, role: true },
      });

      if (!student) {
        throw new NotFoundError("Student not found");
      }

      // Parse metadata from socialLinks JSON
      const meta = (student.socialLinks as any) || {};
      const github = meta.github || "";
      const linkedin = meta.linkedin || "";
      const portfolio = meta.portfolio || "";
      const website = meta.website || "";
      let coverUrl = meta.coverUrl || "";
      if (meta.coverKey) {
        try {
          coverUrl = await ServiceContainer.storage.getSignedDownloadUrl(meta.coverKey, 3600);
        } catch {
          coverUrl = meta.coverUrl || "";
        }
      }

      let avatarUrl = student.avatarFile?.url || "";
      if (student.avatarFile?.key) {
        try {
          avatarUrl = await ServiceContainer.storage.getSignedDownloadUrl(student.avatarFile.key, 3600);
        } catch {
          avatarUrl = student.avatarFile?.url || "";
        }
      }

      const country = meta.country || "";
      const state = meta.state || "";
      const city = meta.city || "";
      const timezone = meta.timezone || "Asia/Kolkata";
      const language = meta.language || "English";
      const gender = meta.gender || "";
      const dateOfBirth = meta.dateOfBirth || "";
      const goals = meta.goals || [];
      const wishlistIds = meta.wishlist || [];
      const notificationPreferences = meta.notificationPreferences || {
        courseUpdates: true,
        assignmentAlerts: true,
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        weeklyReport: true,
      };

      // 2. Fetch parallel items: enrollments, certificates, attempts, payments, progresses
      const [
        enrollments,
        certificates,
        quizzesAttempts,
        assignmentsSubmissions,
        recentlyViewed,
        lessonProgresses,
        payments,
        auditLogs,
        recentlyViewedLessons,
      ] = await Promise.all([
        // Enrolled Courses
        prisma.enrollment.findMany({
          where: { userId, deletedAt: null },
          include: {
            course: {
              include: {
                instructor: { select: { firstName: true, lastName: true } },
                thumbnail: true,
                category: true,
                modules: {
                  where: { deletedAt: null },
                  include: { lessons: { where: { deletedAt: null, status: "PUBLISHED" } } },
                },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        }),
        // Certificates
        prisma.certificate.findMany({
          where: { userId },
          include: { course: true },
          orderBy: { issuedAt: "desc" },
        }),
        // Quiz attempts
        prisma.quizAttempt.findMany({
          where: { userId },
          include: { quiz: true },
          orderBy: { startedAt: "desc" },
        }),
        // Assignment submissions
        prisma.assignmentSubmission.findMany({
          where: { studentId: userId },
          include: { assignment: true },
          orderBy: { submittedAt: "desc" },
        }),
        // Recently viewed
        prisma.recentlyViewedLesson.findFirst({
          where: { userId },
          orderBy: { lastViewedAt: "desc" },
          include: { lesson: { include: { module: true } }, course: true },
        }),
        // Lesson Progresses
        prisma.lessonProgress.findMany({
          where: { userId },
          orderBy: { lastAccessedAt: "desc" },
        }),
        // Payments
        prisma.payment.findMany({
          where: { userId },
          include: { course: true },
          orderBy: { createdAt: "desc" },
        }),
        // User login/activity audit logs
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
        // Recently viewed lessons list for streak/heatmap alignment
        prisma.recentlyViewedLesson.findMany({
          where: { userId },
          select: { lastViewedAt: true },
          orderBy: { lastViewedAt: "desc" },
        }),
      ]);

      // 3. Compute Streak dynamically (IST based)
      const uniqueDays = new Set<number>();

      recentlyViewedLessons.forEach((v) => {
        const dayIndex = Math.floor((v.lastViewedAt.getTime() + (5.5 * 60 * 60 * 1000)) / 86400000);
        uniqueDays.add(dayIndex);
      });

      lessonProgresses.forEach((p) => {
        const dayIndex = Math.floor((p.lastAccessedAt.getTime() + (5.5 * 60 * 60 * 1000)) / 86400000);
        uniqueDays.add(dayIndex);
      });

      enrollments.forEach((e) => {
        const dayIndex = Math.floor((e.enrolledAt.getTime() + (5.5 * 60 * 60 * 1000)) / 86400000);
        uniqueDays.add(dayIndex);
      });

      let streak = 0;
      const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
      if (sortedDays.length > 0) {
        const todayIndex = Math.floor((Date.now() + (5.5 * 60 * 60 * 1000)) / 86400000);
        if (sortedDays[0] === todayIndex || sortedDays[0] === todayIndex - 1) {
          streak = 1;
          for (let i = 1; i < sortedDays.length; i++) {
            if (sortedDays[i] === sortedDays[i - 1] - 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      if (student.learningStreak > streak) {
        streak = student.learningStreak;
      }

      // Compute total watch time
      const totalWatchTime = lessonProgresses.reduce((sum, p) => sum + p.watchTimeSeconds, 0);
      const totalLearningHours = Math.round((totalWatchTime / 3600) * 10) / 10;

      // Compute XP and Level
      const lessonsCompletedCount = lessonProgresses.filter((p) => p.completed).length;
      const quizzesPassedCount = quizzesAttempts.filter((q) => q.passed).length;
      const xpPoints = enrollments.length * 500 + lessonsCompletedCount * 100 + quizzesPassedCount * 250;
      const currentLevel = Math.floor(xpPoints / 1000) + 1;
      const xpProgressPct = Math.round(((xpPoints % 1000) / 1000) * 100);
      const completedCoursesCount = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length;

      // Compute Leaderboard Rank relative to hours learned
      const rank = 1 + await prisma.user.count({
        where: {
          role: { name: "Student" },
          totalLearningHours: { gt: totalLearningHours },
        },
      });

      // 4. Learning Calendar Contribution Grid (Past 6 months)
      const calendarData: Record<string, number> = {};
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      recentlyViewedLessons.forEach((v) => {
        if (v.lastViewedAt >= sixMonthsAgo) {
          const dateStr = new Date(v.lastViewedAt.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split("T")[0];
          calendarData[dateStr] = (calendarData[dateStr] || 0) + 1;
        }
      });

      lessonProgresses.forEach((p) => {
        if (p.lastAccessedAt >= sixMonthsAgo) {
          const dateStr = new Date(p.lastAccessedAt.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split("T")[0];
          calendarData[dateStr] = (calendarData[dateStr] || 0) + 1;
        }
      });

      enrollments.forEach((e) => {
        if (e.enrolledAt >= sixMonthsAgo) {
          const dateStr = new Date(e.enrolledAt.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split("T")[0];
          calendarData[dateStr] = (calendarData[dateStr] || 0) + 1;
        }
      });

      // 5. Dynamic Weekly Analytics (Last 7 Days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000 + (5.5 * 60 * 60 * 1000));
        return d.toISOString().split("T")[0];
      }).reverse();
      const dailyHoursMap = new Map<string, number>();
      lessonProgresses.forEach((p) => {
        const localTime = new Date(p.lastAccessedAt.getTime() + (5.5 * 60 * 60 * 1000));
        const dayStr = localTime.toISOString().split('T')[0];
        dailyHoursMap.set(dayStr, (dailyHoursMap.get(dayStr) ?? 0) + p.watchTimeSeconds / 3600);
      });
      const weeklyHours = last7Days.map((day) => Math.round((dailyHoursMap.get(day) ?? 0) * 10) / 10);

      // 6. Skills Dynamic Extraction
      // Scan enrolled course categories and flag completion rates
      const skillCounts: Record<string, { total: number; completed: number; score: number }> = {};
      enrollments.forEach((e) => {
        const category = e.course.category?.name || "LMS Core";
        if (!skillCounts[category]) {
          skillCounts[category] = { total: 0, completed: 0, score: 0 };
        }
        skillCounts[category].total += 1;
        if (e.status === EnrollmentStatus.COMPLETED) {
          skillCounts[category].completed += 1;
        }
      });
      const skills = Object.keys(skillCounts).map((cat) => {
        const item = skillCounts[cat];
        const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
        const level = pct >= 80 ? "Advanced" : pct >= 40 ? "Intermediate" : "Beginner";
        return {
          name: cat,
          level,
          completion: pct || 25, // default basic skill baseline
          color: cat === "Programming" ? "blue" : cat === "Design" ? "pink" : "yellow",
        };
      });

      // Renders standard roadmap nodes
      const roadmapNodes = [
        { id: "1", title: "HTML & CSS", status: "COMPLETED" },
        { id: "2", title: "JavaScript Core", status: lessonsCompletedCount >= 1 ? "COMPLETED" : "CURRENT" },
        { id: "3", title: "React Frontend", status: lessonsCompletedCount >= 5 ? "CURRENT" : "UPCOMING" },
        { id: "4", title: "Node.js Backend", status: "UPCOMING" },
        { id: "5", title: "MongoDB / DBs", status: "UPCOMING" },
        { id: "6", title: "Full Stack App", status: "UPCOMING" },
      ];

      // Achievements/Badges definitions
      const achievements = [
        { id: "first-course", name: "First Course", description: "Enrolled in your first pathway", unlocked: enrollments.length > 0, progress: enrollments.length > 0 ? 100 : 0 },
        { id: "streak-7", name: "7-Day Streak", description: "Learn 7 days consecutively", unlocked: streak >= 7, progress: Math.min(Math.round((streak / 7) * 100), 100) },
        { id: "quiz-master", name: "Quiz Master", description: "Completed 3 quizzes successfully", unlocked: quizzesPassedCount >= 3, progress: Math.min(Math.round((quizzesPassedCount / 3) * 100), 100) },
        { id: "fast-learner", name: "Fast Learner", description: "Invested 10 hours in lessons", unlocked: totalLearningHours >= 10, progress: Math.min(Math.round((totalLearningHours / 10) * 100), 100) },
        { id: "perfect-score", name: "Perfect Score", description: "Scored 100% on any quiz", unlocked: quizzesAttempts.some(q => q.percentage === 100), progress: quizzesAttempts.some(q => q.percentage === 100) ? 100 : 0 },
        { id: "assign-helper", name: "Helper", description: "Submitted at least one assignment", unlocked: assignmentsSubmissions.length > 0, progress: assignmentsSubmissions.length > 0 ? 100 : 0 },
      ];

      // Enrolled courses details
      const coursesProgress = await Promise.all(
        enrollments.map(async (e) => {
          let totalLessons = 0;
          e.course.modules.forEach((m) => {
            totalLessons += m.lessons.length;
          });

          let thumbnailUrl = null;
          if (e.course.thumbnail?.key) {
            try {
              thumbnailUrl = await ServiceContainer.storage.getSignedDownloadUrl(e.course.thumbnail.key, 3600);
            } catch (err) {
              thumbnailUrl = e.course.thumbnail.url;
            }
          }

          const progressRecord = await prisma.learningProgress.findUnique({
            where: { userId_courseId: { userId, courseId: e.courseId } },
          });

          const currentPct = progressRecord?.progressPercentage ?? 0.0;
          const currentModuleTitle = e.course.modules[0]?.title || "Getting Started";
          const currentLessonTitle = e.course.modules[0]?.lessons[0]?.title || "Introduction";

          return {
            id: e.id,
            courseId: e.courseId,
            title: e.course.title,
            slug: e.course.slug,
            thumbnailUrl,
            instructorName: `${e.course.instructor.firstName} ${e.course.instructor.lastName}`,
            progress: Math.round(currentPct),
            currentModule: currentModuleTitle,
            currentLesson: currentLessonTitle,
            status: e.status,
            totalLessons,
            lastAccessed: progressRecord?.lastAccessedAt ?? e.enrolledAt,
            estimatedCompletion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          };
        })
      );

      // AI Learning Insights strings
      const insights = [
        `You have invested ${totalLearningHours} total hours learning so far!`,
        streak > 0 
          ? `You have a dynamic streak of ${streak} active days! Complete a lesson today to keep it going.`
          : `No active learning streak. Start a lesson today to begin your streak!`,
        quizzesPassedCount > 0 
          ? `Your average quiz performance is ${Math.round(quizzesAttempts.reduce((sum, q) => sum + q.percentage, 0) / (quizzesAttempts.length || 1))}% across ${quizzesAttempts.length} attempts.`
          : `You haven't passed any quizzes yet. Review modules and take a quiz to test your skills!`,
        enrollments.length > 0 
          ? `Based on your enrollment in ${enrollments[0]?.course.title}, we recommend matching courses in the catalog!`
          : `Enroll in our trending courses to unlock certificates and skills.`
      ];

      // Profile completion rate
      const missingFields: string[] = [];
      let completionScore = 0;

      if (student.firstName && student.lastName) completionScore += 20; else missingFields.push("First/Last Name");
      if (student.phone) completionScore += 15; else missingFields.push("Phone Number");
      if (student.bio) completionScore += 15; else missingFields.push("Bio");
      if (student.college) completionScore += 15; else missingFields.push("College Name");
      if (student.avatarFileId) completionScore += 15; else missingFields.push("Profile Avatar Image");
      if (coverUrl) completionScore += 10; else missingFields.push("Profile Cover Banner");
      if (github || linkedin) completionScore += 10; else missingFields.push("Social Links (GitHub/LinkedIn)");

      // Payments list mapped
      const paymentHistory = payments.map((p) => ({
        id: p.id,
        courseTitle: p.course.title,
        invoiceNumber: p.transactionId || `INV-${p.id.slice(0,8).toUpperCase()}`,
        amount: Number(p.amount),
        tax: Number(p.tax),
        discount: Number(p.discount),
        status: p.status,
        date: p.paidAt || p.createdAt,
        refundStatus: p.status === PaymentStatus.REFUNDED ? "REFUNDED" : "NONE",
      }));

      // Wishlist detail extraction
      const wishlistIdsArray = wishlistIds || [];
      const wishlistCourses = await prisma.course.findMany({
        where: { id: { in: wishlistIdsArray } },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          thumbnail: true,
        },
      });
      const wishlistMapped = await Promise.all(
        wishlistCourses.map(async (c) => {
          let thumbnailUrl = null;
          if (c.thumbnail?.key) {
            try {
              thumbnailUrl = await ServiceContainer.storage.getSignedDownloadUrl(c.thumbnail.key, 3600);
            } catch {
              thumbnailUrl = c.thumbnail.url;
            }
          }
          return {
            id: c.id,
            title: c.title,
            slug: c.slug,
            thumbnailUrl,
            instructorName: `${c.instructor.firstName} ${c.instructor.lastName}`,
            price: Number(c.price),
            discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
          };
        })
      );

      // Recommendations list
      const popularCourses = await prisma.course.findMany({
        where: {
          id: { notIn: enrollments.map((e) => e.courseId) },
          status: "PUBLISHED",
        },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          thumbnail: true,
        },
        take: 3,
      });
      const recommendations = await Promise.all(
        popularCourses.map(async (c) => {
          let thumbnailUrl = null;
          if (c.thumbnail?.key) {
            try {
              thumbnailUrl = await ServiceContainer.storage.getSignedDownloadUrl(c.thumbnail.key, 3600);
            } catch {
              thumbnailUrl = c.thumbnail.url;
            }
          }
          return {
            id: c.id,
            title: c.title,
            slug: c.slug,
            thumbnailUrl,
            instructorName: `${c.instructor.firstName} ${c.instructor.lastName}`,
            price: Number(c.price),
            discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
          };
        })
      );

      // Recent timeline logs mapped
      const recentActivities = [
        ...auditLogs.map((log) => ({
          id: log.id,
          type: log.action,
          title: log.action.replace(/_/g, " "),
          description: `Event triggered with status: ${log.success ? "SUCCESS" : "FAILED"}`,
          date: log.createdAt,
        })),
        ...lessonProgresses.slice(0, 5).map((lp) => ({
          id: lp.id,
          type: "LESSON_COMPLETED",
          title: "Lesson Progress Updated",
          description: lp.completed ? "Marked lesson as completed" : "Watched lesson progress",
          date: lp.lastAccessedAt,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

      const profileData = {
        header: {
          userId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone || "",
          college: student.college || "",
          bio: student.bio || "",
          avatarUrl,
          roleName: student.role?.name || "Student",
          isEmailVerified: student.isEmailVerified,
          createdAt: student.createdAt,
          socials: {
            github,
            linkedin,
            portfolio,
            website,
            coverUrl,
            country,
            state,
            city,
            timezone,
            language,
            gender,
            dateOfBirth,
          },
        },
        learningOverview: {
          coursesEnrolled: enrollments.length,
          coursesCompleted: completedCoursesCount,
          coursesInProgress: enrollments.length - completedCoursesCount,
          certificatesEarned: certificates.length,
          assignmentsSubmitted: assignmentsSubmissions.length,
          quizzesAttempted: quizzesAttempts.length,
          averageQuizScore: quizzesPassedCount > 0 ? Math.round(quizzesAttempts.reduce((sum, q) => sum + q.percentage, 0) / (quizzesAttempts.length || 1)) : 0,
          totalLearningHours,
          learningStreak: streak,
          longestStreak: Math.max(streak, student.learningStreak),
          currentLevel,
          xpPoints,
          xpProgressPct,
          leaderboardRank: rank,
        },
        calendarData,
        weeklyHours,
        skills,
        roadmapNodes,
        achievements,
        coursesProgress,
        insights,
        profileCompletion: {
          percentage: completionScore,
          missingFields,
        },
        goals,
        recentActivities,
        paymentHistory,
        wishlist: wishlistMapped,
        recommendations,
        notificationPreferences,
      };

      res.json({ success: true, data: profileData });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfileSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const {
        firstName,
        lastName,
        phone,
        bio,
        college,
        github,
        linkedin,
        portfolio,
        website,
        coverUrl,
        country,
        state,
        city,
        timezone,
        language,
        gender,
        dateOfBirth,
        goals,
        notificationPreferences,
      } = req.body;

      // Read current socialLinks
      const currentStudent = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!currentStudent) {
        throw new NotFoundError("Student profile not found");
      }

      const prevMeta = (currentStudent.socialLinks as any) || {};

      // Merge metadata into socialLinks JSON
      const updatedMeta = {
        ...prevMeta,
        github: github !== undefined ? github : prevMeta.github,
        linkedin: linkedin !== undefined ? linkedin : prevMeta.linkedin,
        portfolio: portfolio !== undefined ? portfolio : prevMeta.portfolio,
        website: website !== undefined ? website : prevMeta.website,
        coverUrl: coverUrl !== undefined ? coverUrl : prevMeta.coverUrl,
        country: country !== undefined ? country : prevMeta.country,
        state: state !== undefined ? state : prevMeta.state,
        city: city !== undefined ? city : prevMeta.city,
        timezone: timezone !== undefined ? timezone : prevMeta.timezone,
        language: language !== undefined ? language : prevMeta.language,
        gender: gender !== undefined ? gender : prevMeta.gender,
        dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : prevMeta.dateOfBirth,
        goals: goals !== undefined ? goals : prevMeta.goals,
        notificationPreferences: notificationPreferences !== undefined 
          ? notificationPreferences 
          : prevMeta.notificationPreferences,
      };

      await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName !== undefined ? firstName : currentStudent.firstName,
          lastName: lastName !== undefined ? lastName : currentStudent.lastName,
          phone: phone !== undefined ? phone : currentStudent.phone,
          bio: bio !== undefined ? bio : currentStudent.bio,
          college: college !== undefined ? college : currentStudent.college,
          socialLinks: updatedMeta,
        },
      });

      // Trigger audit log
      await ServiceContainer.audit.log({
        userId,
        action: "PROFILE_UPDATED",
        resource: "StudentProfile",
        resourceId: userId,
        details: { fieldsUpdated: Object.keys(req.body) },
        status: "SUCCESS",
      }).catch(() => {});

      res.json({ success: true, data: { success: true } });
    } catch (err) {
      next(err);
    }
  }

  static async toggleWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ success: false, message: "courseId is required" });
      }

      const student = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!student) {
        throw new NotFoundError("Student not found");
      }

      const prevMeta = (student.socialLinks as any) || {};
      let wishlist: string[] = prevMeta.wishlist || [];

      if (wishlist.includes(courseId)) {
        wishlist = wishlist.filter((id) => id !== courseId);
      } else {
        wishlist.push(courseId);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: {
            ...prevMeta,
            wishlist,
          },
        },
      });

      res.json({ success: true, wishlist });
    } catch (err) {
      next(err);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError("No avatar file payload detected in request");
      }

      const userId = req.user!.userId;
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;

      StorageValidator.validateFile(originalName, mimeType, size, "avatar");
      const secureKey = StorageValidator.generateSecureKey(originalName, "avatar");

      const result = await ServiceContainer.storage.upload(req.file.buffer, secureKey, {
        contentType: mimeType,
      });

      const fileRecord = await prisma.file.create({
        data: {
          name: path.basename(secureKey),
          originalName,
          mimeType,
          extension: path.extname(originalName).toLowerCase(),
          size,
          bucket: (result.bucket as string) || "indiwebpros-lms-storage",
          key: secureKey,
          url: (result.url as string) || `https://${result.bucket || 'indiwebpros-lms-storage'}.s3.amazonaws.com/${secureKey}`,
          uploadedBy: userId,
        },
      });

      // Update User avatarFileId
      await prisma.user.update({
        where: { id: userId },
        data: { avatarFileId: fileRecord.id },
      });

      await ServiceContainer.audit.log({
        userId,
        action: "AVATAR_UPLOADED",
        resource: "User",
        resourceId: userId,
        details: { fileId: fileRecord.id, key: secureKey },
        status: "SUCCESS",
      }).catch(() => {});

      let signedAvatarUrl = fileRecord.url;
      if (fileRecord.key) {
        try {
          signedAvatarUrl = await ServiceContainer.storage.getSignedDownloadUrl(fileRecord.key, 3600);
        } catch {}
      }

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatarUrl: signedAvatarUrl,
          fileId: fileRecord.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async uploadCover(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError("No cover file payload detected in request");
      }

      const userId = req.user!.userId;
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;

      StorageValidator.validateFile(originalName, mimeType, size, "cover");
      const secureKey = StorageValidator.generateSecureKey(originalName, "cover");

      const result = await ServiceContainer.storage.upload(req.file.buffer, secureKey, {
        contentType: mimeType,
      });

      const fileRecord = await prisma.file.create({
        data: {
          name: path.basename(secureKey),
          originalName,
          mimeType,
          extension: path.extname(originalName).toLowerCase(),
          size,
          bucket: (result.bucket as string) || "indiwebpros-lms-storage",
          key: secureKey,
          url: (result.url as string) || `https://${result.bucket || 'indiwebpros-lms-storage'}.s3.amazonaws.com/${secureKey}`,
          uploadedBy: userId,
        },
      });

      // Fetch user to merge socialLinks.coverUrl & coverKey
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError("User not found");

      const prevMeta = (user.socialLinks as any) || {};
      const updatedMeta = {
        ...prevMeta,
        coverUrl: fileRecord.url,
        coverKey: fileRecord.key,
      };

      await prisma.user.update({
        where: { id: userId },
        data: { socialLinks: updatedMeta },
      });

      await ServiceContainer.audit.log({
        userId,
        action: "COVER_UPLOADED",
        resource: "User",
        resourceId: userId,
        details: { fileId: fileRecord.id, key: secureKey },
        status: "SUCCESS",
      }).catch(() => {});

      let signedCoverUrl = fileRecord.url;
      if (fileRecord.key) {
        try {
          signedCoverUrl = await ServiceContainer.storage.getSignedDownloadUrl(fileRecord.key, 3600);
        } catch {}
      }

      res.status(200).json({
        success: true,
        message: "Cover photo uploaded successfully",
        data: {
          coverUrl: signedCoverUrl,
          fileId: fileRecord.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
