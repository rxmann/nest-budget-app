import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetQueryDto } from './dto/budget-query.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { toBudgetResponse } from './mapper/budget.mapper';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { AppException } from '../common/exceptions/app.exception';
import { HttpStatus } from '@nestjs/common';
import { PaginatedResult } from './types/budget.types';
import { toStorageAmount } from './utils/budget.util';
import { CurrentUserType } from 'src/auth/decorators/current-user.decorator';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBudget(
    user: CurrentUserType,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: dto.budgetCategoryId, userId: user.id, isActive: true },
    });

    if (!category) {
      throw new AppException(
        'Category not found or access denied',
        HttpStatus.BAD_REQUEST,
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId: user.id,
        budgetCategoryId: dto.budgetCategoryId,
        name: dto.name,
        amount: toStorageAmount(dto.amount),
        currency: dto.currency ?? 'NPR',
        budgetDate: new Date(dto.budgetDate),
        receiptUrl: dto.receiptUrl,
        tags: dto.tags ?? [],
        isRecurring: false,
        createdBy: user.id,
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Budget created: ${budget.id} for user: ${user.id}`);
    return toBudgetResponse(budget);
  }

  async getAllBudgets(
    user: CurrentUserType,
    query: BudgetQueryDto,
  ): Promise<PaginatedResult<BudgetResponseDto>> {
    const { page, limit, sortBy = 'budgetDate', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [budgets, total] = await this.prisma.$transaction([
      this.prisma.budget.findMany({
        where: { userId: user.id },
        include: { budgetCategory: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.budget.count({ where: { userId: user.id } }),
    ]);

    return {
      data: budgets.map(toBudgetResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async getBudgetById(
    user: CurrentUserType,
    budgetId: string,
  ): Promise<BudgetResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
      include: { budgetCategory: true },
    });

    if (!budget) throw new NotFoundException('Budget');

    return toBudgetResponse(budget);
  }

  async updateBudget(
    user: CurrentUserType,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Budget');

    if (dto.budgetCategoryId) {
      const category = await this.prisma.budgetCategory.findFirst({
        where: { id: dto.budgetCategoryId, userId: user.id, isActive: true },
      });
      if (!category) {
        throw new AppException(
          'Category not found or access denied',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updated = await this.prisma.budget.update({
      where: {
        id: budgetId,
        version: existing.version, // optimistic lock check
      },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.amount && { amount: toStorageAmount(dto.amount) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.budgetDate && { budgetDate: new Date(dto.budgetDate) }),
        ...(dto.budgetCategoryId && { budgetCategoryId: dto.budgetCategoryId }),
        ...(dto.receiptUrl && { receiptUrl: dto.receiptUrl }),
        ...(dto.tags && { tags: dto.tags }),
        version: { increment: 1 },
        lastModifiedBy: user.id,
      },
      include: { budgetCategory: true },
    });

    this.logger.log(`Budget updated: ${budgetId} for user: ${user.id}`);
    return toBudgetResponse(updated);
  }

  async deleteBudget(user: CurrentUserType, budgetId: string): Promise<void> {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId: user.id },
    });

    if (!existing) throw new NotFoundException('Budget');

    await this.prisma.budget.delete({ where: { id: budgetId } });
    this.logger.log(`Budget deleted: ${budgetId} for user: ${user.id}`);
  }
}

