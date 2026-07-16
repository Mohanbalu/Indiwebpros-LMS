import { prisma } from "@/database/client";
import { Coupon, DiscountType } from "@/generated/client";
import { NotFoundError, ValidationError } from "@/errors/custom-errors";
import {
  CouponExpiredException,
  CouponAlreadyUsedException,
} from "../errors/enrollment-exceptions";
import { CreateCouponInput } from "../validators/enrollment.validator";
import { ServiceContainer } from "@/services/shared/service-container";

export class CouponService {
  async createCoupon(input: CreateCouponInput, userId: string): Promise<Coupon> {
    const existing = await prisma.coupon.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ValidationError(`Coupon code ${input.code} already exists`);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: input.code,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUsage: input.maxUsage ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        minimumAmount: input.minimumAmount ?? 0,
        isActive: input.isActive ?? true,
      },
    });

    try {
      await ServiceContainer.audit.log({
        userId,
        action: "COUPON_CREATED",
        resource: "Coupon",
        resourceId: coupon.id,
        details: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue.toNumber() },
        status: "SUCCESS",
      });
    } catch {}

    return coupon;
  }

  async validateCoupon(code: string, userId: string, coursePrice: number): Promise<Coupon> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new CouponExpiredException("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new CouponExpiredException("Coupon is inactive");
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new CouponExpiredException("Coupon has expired or is not active yet");
    }

    if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage) {
      throw new CouponExpiredException("Coupon has reached its maximum usage limit");
    }

    if (coursePrice < coupon.minimumAmount.toNumber()) {
      throw new ValidationError(`Course price does not meet the minimum amount of ₹${coupon.minimumAmount.toNumber()} required for this coupon`);
    }

    // Check if the user has already used this coupon
    const usage = await prisma.couponUsage.findFirst({
      where: {
        couponId: coupon.id,
        userId,
        payment: {
          status: "SUCCESS",
        },
      },
    });

    if (usage) {
      throw new CouponAlreadyUsedException();
    }

    return coupon;
  }

  async applyDiscount(coupon: Coupon, basePrice: number): Promise<{ discountAmount: number; finalAmount: number }> {
    let discountAmount = 0;
    const value = coupon.discountValue.toNumber();

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (basePrice * value) / 100;
    } else if (coupon.discountType === DiscountType.FIXED) {
      discountAmount = value;
    }

    // Discount cannot exceed the base price
    if (discountAmount > basePrice) {
      discountAmount = basePrice;
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);

    return {
      discountAmount,
      finalAmount,
    };
  }

  async getCouponByCode(code: string): Promise<Coupon> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundError(`Coupon ${code} not found`);
    }
    return coupon;
  }

  async listCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

export const couponService = new CouponService();
