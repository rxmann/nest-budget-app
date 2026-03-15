import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetService } from '../budget/budget.service';
import { CreatePaymentReminderDto } from './dto/create-payment-reminder.dto';
import { UpdatePaymentReminderDto } from './dto/update-payment-reminder.dto';
import { AcknowledgeReminderDto } from './dto/acknowledge-reminder.dto';
import { PaymentReminderResponseDto } from './dto/payment-reminder-response.dto';
import { toPaymentReminderResponse } from './mapper/payment-reminder.mapper';
import { advanceNextDueDate } from './utils/reminder.util';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { ReminderStatus } from '../../generated/prisma/client';
import { CurrentUserType } from 'src/auth/decorators/current-user.decorator';

@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetService: BudgetService,
  ) {}

  // ─── List all ──────────────────────────────────────────────────────────────

  async getAllPaymentReminders(
    user: CurrentUserType,
  ): Promise<PaymentReminderResponseDto[]> {
    const reminders = await this.prisma.paymentReminder.findMany({
      where: { userId: user.id },
      include: { budgetCategory: true },
      orderBy: { nextDueDate: 'asc' },
    });

    return reminders.map(toPaymentReminderResponse);
  }

  // ─── Upcoming (next 30 days, active only) ──────────────────────────────────

  async getUpcomingReminders(
    user: CurrentUserType,
  ): Promise<PaymentReminderResponseDto[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    today.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const reminders = await this.prisma.paymentReminder.findMany({
      where: {
        userId: user.id,
        status: ReminderStatus.ACTIVE,
        nextDueDate: { gte: today, lte: endDate },
      },
      include: { budgetCategory: true },
      orderBy: { nextDueDate: 'asc' },
    });

    return reminders.map(toPaymentReminderResponse);
  }

  // ─── Notifications (due today, 1 day, 3 days) ─────────────────────────────

  async getRemindersToNotify(
    user: CurrentUserType,
  ): Promise<PaymentReminderResponseDto[]> {
    const today = new Date();
    const oneDayFromNow = new Date();
    const threeDaysFromNow = new Date();

    today.setHours(0, 0, 0, 0);
    oneDayFromNow.setDate(today.getDate() + 1);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const reminders = await this.prisma.paymentReminder.findMany({
      where: {
        userId: user.id,
        status: ReminderStatus.ACTIVE,
        nextDueDate: {
          in: [today, oneDayFromNow, threeDaysFromNow],
        },
      },
      include: { budgetCategory: true },
      orderBy: { nextDueDate: 'asc' },
    });

    return reminders.map(toPaymentReminderResponse);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createPaymentReminder(
    user: CurrentUserType,
    dto: CreatePaymentReminderDto,
  ): Promise<PaymentReminderResponseDto> {
    await this.validateCategory(dto.categoryId, user.id);

    const reminder = await this.prisma.paymentReminder.create({
      data: {
        userId: user.id,
        categoryId: dto.categoryId,
        reminderName: dto.reminderName,
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
        status: dto.status ?? ReminderStatus.ACTIVE,
        createdBy: user.id,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(
      `Payment reminder created: ${reminder.id} for user: ${user.id}`,
    );
    return toPaymentReminderResponse(reminder);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updatePaymentReminder(
    user: CurrentUserType,
    id: string,
    dto: UpdatePaymentReminderDto,
  ): Promise<PaymentReminderResponseDto> {
    const existing = await this.prisma.paymentReminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Payment reminder');

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId, user.id);
    }

    const updated = await this.prisma.paymentReminder.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.reminderName !== undefined && {
          reminderName: dto.reminderName,
        }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextDueDate !== undefined && {
          nextDueDate: new Date(dto.nextDueDate),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Payment reminder updated: ${id}`);
    return toPaymentReminderResponse(updated);
  }

  // ─── Snooze (toggle + push 1 day) ─────────────────────────────────────────

  async snoozeReminder(
    user: CurrentUserType,
    id: string,
  ): Promise<PaymentReminderResponseDto> {
    const existing = await this.prisma.paymentReminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Payment reminder');

    const nextStatus =
      existing.status === ReminderStatus.SNOOZED
        ? ReminderStatus.ACTIVE
        : ReminderStatus.SNOOZED;

    const snoozedDate = new Date(existing.nextDueDate);
    snoozedDate.setDate(snoozedDate.getDate() + 1);

    const updated = await this.prisma.paymentReminder.update({
      where: { id },
      data: {
        status: nextStatus,
        nextDueDate: snoozedDate,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Reminder snoozed: ${id} → status: ${nextStatus}`);
    return toPaymentReminderResponse(updated);
  }

  // ─── Acknowledge (create budget entry + advance date) ─────────────────────

  async acknowledgeReminder(
    user: CurrentUserType,
    id: string,
    dto: AcknowledgeReminderDto,
  ): Promise<PaymentReminderResponseDto> {
    const existing = await this.prisma.paymentReminder.findFirst({
      where: { id, userId: user.id },
      include: { budgetCategory: true },
    });

    if (!existing) throw new NotFoundException('Payment reminder');

    // create budget entry from acknowledge data
    await this.budgetService.createBudget(user, {
      amount: dto.amount,
      name: dto.name ?? existing.reminderName,
      budgetDate: dto.budgetDate,
      budgetCategoryId: existing.categoryId,
      receiptUrl: dto.receiptUrl,
      tags: dto.tags,
    });

    // advance due date or complete if ONE_TIME
    const { nextDueDate, completed } = advanceNextDueDate(
      existing.nextDueDate,
      existing.frequency,
    );

    const updated = await this.prisma.paymentReminder.update({
      where: { id },
      data: {
        nextDueDate: completed ? existing.nextDueDate : nextDueDate!,
        status: completed ? ReminderStatus.COMPLETED : ReminderStatus.ACTIVE,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Reminder acknowledged: ${id} — budget entry created`);
    return toPaymentReminderResponse(updated);
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async deletePaymentReminder(
    user: CurrentUserType,
    id: string,
  ): Promise<void> {
    const existing = await this.prisma.paymentReminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Payment reminder');

    await this.prisma.paymentReminder.delete({ where: { id } });
    this.logger.log(`Payment reminder deleted: ${id}`);
  }

  // ─── Cron helper ───────────────────────────────────────────────────────────

  async findRemindersToNotify(): Promise<PaymentReminderResponseDto[]> {
    const today = new Date();
    const oneDayFromNow = new Date();
    const threeDaysFromNow = new Date();

    today.setHours(0, 0, 0, 0);
    oneDayFromNow.setDate(today.getDate() + 1);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const reminders = await this.prisma.paymentReminder.findMany({
      where: {
        status: ReminderStatus.ACTIVE,
        nextDueDate: { in: [today, oneDayFromNow, threeDaysFromNow] },
      },
      include: { budgetCategory: true },
    });

    return reminders.map(toPaymentReminderResponse);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async validateCategory(
    categoryId: string,
    userId: string,
  ): Promise<void> {
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId, isActive: true },
      select: { id: true },
    });

    if (!category) throw new NotFoundException('Category');
  }
}
