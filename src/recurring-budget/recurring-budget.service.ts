import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringBudgetDto } from './dto/create-recurring-budget.dto';
import { UpdateRecurringBudgetDto } from './dto/update-recurring-budget.dto';
import { RecurringBudgetQueryDto } from './dto/recurring-budget-query.dto';
import { RecurringBudgetResponseDto } from './dto/recurring-budget-response.dto';
import { toRecurringBudgetResponse } from './mapper/recurring-budget.mapper';
import { calculateNextOccurrence } from './utils/recurrence.util';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { PaginatedResult } from '../budget/types/budget.types';
import { CurrentUserType } from 'src/auth/decorators/current-user.decorator';
import { toStorageAmount } from 'src/budget/utils/budget.util';

@Injectable()
export class RecurringBudgetService {
  private readonly logger = new Logger(RecurringBudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── List ──────────────────────────────────────────────────────────────────

  async getRecurringBudgets(
    user: CurrentUserType,
    query: RecurringBudgetQueryDto,
  ): Promise<PaginatedResult<RecurringBudgetResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurringBudget.findMany({
        where: { userId: user.id },
        include: { budgetCategory: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recurringBudget.count({ where: { userId: user.id } }),
    ]);

    return {
      data: items.map(toRecurringBudgetResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ─── Get by ID ─────────────────────────────────────────────────────────────

  async getRecurringBudget(
    user: CurrentUserType,
    id: string,
  ): Promise<RecurringBudgetResponseDto> {
    const rb = await this.prisma.recurringBudget.findFirst({
      where: { id, userId: user.id },
      include: { budgetCategory: true },
    });

    if (!rb) throw new NotFoundException('Recurring budget');

    return toRecurringBudgetResponse(rb);
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async createRecurringBudget(
    user: CurrentUserType,
    dto: CreateRecurringBudgetDto,
  ): Promise<RecurringBudgetResponseDto> {
    await this.validateCategory(dto.budgetCategoryId, user.id);

    const startDate = new Date(dto.startDate);
    const nextOccurrence = calculateNextOccurrence(startDate, dto.frequency);

    const rb = await this.prisma.recurringBudget.create({
      data: {
        userId: user.id,
        budgetCategoryId: dto.budgetCategoryId,
        amount: toStorageAmount(dto.amount),
        currency: 'NPR',
        name: dto.name,
        description: dto.description,
        frequency: dto.frequency,
        frequencyInterval: dto.frequencyInterval ?? 1,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextOccurrence,
        isActive: true,
        createdBy: user.id,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Recurring budget created: ${rb.id} for user: ${user.id}`);
    return toRecurringBudgetResponse(rb);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateRecurringBudget(
    user: CurrentUserType,
    id: string,
    dto: UpdateRecurringBudgetDto,
  ): Promise<RecurringBudgetResponseDto> {
    const existing = await this.prisma.recurringBudget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Recurring budget');

    if (dto.budgetCategoryId) {
      await this.validateCategory(dto.budgetCategoryId, user.id);
    }

    // recalculate next occurrence if startDate or frequency changed
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const frequency = dto.frequency ?? existing.frequency;
    const nextOccurrence = calculateNextOccurrence(startDate, frequency);

    const updated = await this.prisma.recurringBudget.update({
      where: { id },
      data: {
        ...(dto.budgetCategoryId !== undefined && {
          budgetCategoryId: dto.budgetCategoryId,
        }),
        ...(dto.amount !== undefined && {
          amount: toStorageAmount(dto.amount),
        }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.frequencyInterval !== undefined && {
          frequencyInterval: dto.frequencyInterval,
        }),
        ...(dto.startDate !== undefined && { startDate }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        nextOccurrence,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Recurring budget updated: ${id} for user: ${user.id}`);
    return toRecurringBudgetResponse(updated);
  }

  // ─── Enable / Disable ──────────────────────────────────────────────────────

  async disableRecurringBudget(
    user: CurrentUserType,
    id: string,
  ): Promise<RecurringBudgetResponseDto> {
    const existing = await this.prisma.recurringBudget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Recurring budget');

    if (!existing.isActive) {
      throw new BadRequestException('Recurring budget is already disabled');
    }

    const updated = await this.prisma.recurringBudget.update({
      where: { id },
      data: { isActive: false, lastModifiedBy: user.id },
      include: { budgetCategory: true },
    });

    this.logger.log(`Recurring budget disabled: ${id}`);
    return toRecurringBudgetResponse(updated);
  }

  async enableRecurringBudget(
    user: CurrentUserType,
    id: string,
  ): Promise<RecurringBudgetResponseDto> {
    const existing = await this.prisma.recurringBudget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Recurring budget');

    if (existing.isActive) {
      throw new BadRequestException('Recurring budget is already enabled');
    }

    const updated = await this.prisma.recurringBudget.update({
      where: { id },
      data: { isActive: true, lastModifiedBy: user.id },
      include: { budgetCategory: true },
    });

    this.logger.log(`Recurring budget enabled: ${id}`);
    return toRecurringBudgetResponse(updated);
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async deleteRecurringBudget(
    user: CurrentUserType,
    id: string,
  ): Promise<void> {
    const existing = await this.prisma.recurringBudget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Recurring budget');

    await this.prisma.recurringBudget.delete({ where: { id } });
    this.logger.log(`Recurring budget deleted: ${id} for user: ${user.id}`);
  }

  // ─── Cron helper — called by scheduler, not exposed via HTTP ───────────────

  async findDueRecurringBudgets() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.recurringBudget.findMany({
      where: {
        isActive: true,
        nextOccurrence: { lte: today },
      },
      include: {
        budgetCategory: true,
        user: true,
      },
    });
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

    if (!category) {
      throw new NotFoundException('Category');
    }
  }
}
