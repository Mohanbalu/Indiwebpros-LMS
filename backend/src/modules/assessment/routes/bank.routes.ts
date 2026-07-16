import { Router, Request, Response, NextFunction } from "express";
import { questionBankService } from "../services/bank.service";
import { authGuard, authorize } from "@/middlewares/auth";
import { questionBankSchema } from "../validators/assessment.validator";
import { ValidationError } from "@/errors/custom-errors";
import { QuestionBankCategory } from "@/generated/client";

const router = Router();
const instructorOrAdmin = authorize(["Admin", "Instructor"]);
router.use(authGuard);

router.post("/", instructorOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = questionBankSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid question bank payload", parsed.error.errors);

    const userId = req.user!.userId;
    const role = req.user!.role;

    const entry = await questionBankService.addQuestionToBank(userId, role, parsed.data);
    res.status(201).json({ success: true, data: entry });
  } catch (e) { next(e); }
});

router.delete("/:id", instructorOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const role = req.user!.role;

    await questionBankService.removeQuestionFromBank(userId, role, id);
    res.status(204).send();
  } catch (e) { next(e); }
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as QuestionBankCategory | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await questionBankService.listQuestionBankQuestions(category, page, limit);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

export default router;
