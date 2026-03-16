import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';
import { BudgetCategoryQueryDto } from './dto/budget-category-query.dto';
import { BudgetCategoryResponseDto } from './dto/budget-category-response.dto';
import { toBudgetCategoryResponse } from './mapper/budget-category.mapper';
import { NotFoundException } from '../common/exceptions/not-found.exception';
import { PaginatedResult } from '../budget/types/budget.types';
import { CurrentUserType } from 'src/auth/decorators/current-user.decorator';

@Injectable()
export class BudgetCategoryService {
  private readonly logger = new Logger(BudgetCategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async createCategory(
    user: CurrentUserType,
    dto: CreateBudgetCategoryDto,
  ): Promise<BudgetCategoryResponseDto> {
    const exists = await this.prisma.budgetCategory.findFirst({
      where: { userId: user.id, name: dto.name },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const category = await this.prisma.budgetCategory.create({
      data: {
        userId: user.id,
        name: dto.name,
        notes: dto.notes,
        budgetType: dto.budgetType,
        isActive: dto.isActive ?? true,
        createdBy: user.id,
        lastModifiedBy: user.id,
      },
    });

    this.logger.log(`Category created: ${category.id} for user: ${user.id}`);
    return toBudgetCategoryResponse(category);
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  async getAllCategories(
    user: CurrentUserType,
    query: BudgetCategoryQueryDto,
  ): Promise<PaginatedResult<BudgetCategoryResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.budgetCategory.findMany({
        where: { userId: user.id, isActive: true },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.budgetCategory.count({
        where: { userId: user.id, isActive: true },
      }),
    ]);

    return {
      data: categories.map(toBudgetCategoryResponse),
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

  async getCategoryById(
    user: CurrentUserType,
    categoryId: string,
  ): Promise<BudgetCategoryResponseDto> {
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId: user.id, isActive: true },
    });

    if (!category) throw new NotFoundException('Category');

    return toBudgetCategoryResponse(category);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateCategory(
    user: CurrentUserType,
    categoryId: string,
    dto: UpdateBudgetCategoryDto,
  ): Promise<BudgetCategoryResponseDto> {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId: user.id, isActive: true },
    });

    if (!existing) throw new NotFoundException('Category');

    // duplicate name check — exclude current category
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.budgetCategory.findFirst({
        where: {
          userId: user.id,
          name: dto.name,
          NOT: { id: categoryId },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    const updated = await this.prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.budgetType !== undefined && { budgetType: dto.budgetType }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        lastModifiedBy: user.id,
      },
    });

    this.logger.log(`Category updated: ${categoryId} for user: ${user.id}`);
    return toBudgetCategoryResponse(updated);
  }

  // ─── Delete (soft) ─────────────────────────────────────────────────────────

  async deleteCategory(
    user: CurrentUserType,
    categoryId: string,
    newCategoryId?: string,
  ): Promise<void> {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId: user.id, isActive: true },
    });

    if (!existing) throw new NotFoundException('Category');

    // count references in parallel
    const [budgetCount, recurringCount, reminderCount] = await Promise.all([
      this.prisma.budget.count({ where: { budgetCategoryId: categoryId } }),
      this.prisma.recurringBudget.count({
        where: { budgetCategoryId: categoryId },
      }),
      this.prisma.paymentReminder.count({ where: { categoryId } }),
    ]);

    const hasReferences = budgetCount + recurringCount + reminderCount > 0;

    // references exist but no replacement provided — return counts to client
    if (hasReferences && !newCategoryId) {
      throw new ConflictException({
        message: 'Category has existing references',
        budgetCount,
        recurringCount,
        reminderCount,
      });
    }

    // validate replacement category belongs to same user
    if (newCategoryId) {
      const replacement = await this.prisma.budgetCategory.findFirst({
        where: { id: newCategoryId, userId: user.id, isActive: true },
        select: { id: true },
      });
      if (!replacement) throw new NotFoundException('Replacement category');
    }

    // bulk reassign + soft delete in single transaction
    await this.prisma.$transaction(async (tx) => {
      if (hasReferences && newCategoryId) {
        await Promise.all([
          tx.budget.updateMany({
            where: { budgetCategoryId: categoryId },
            data: { budgetCategoryId: newCategoryId },
          }),
          tx.recurringBudget.updateMany({
            where: { budgetCategoryId: categoryId },
            data: { budgetCategoryId: newCategoryId },
          }),
          tx.paymentReminder.updateMany({
            where: { categoryId },
            data: { categoryId: newCategoryId },
          }),
        ]);
      }

      await tx.budgetCategory.update({
        where: { id: categoryId },
        data: { isActive: false, lastModifiedBy: user.id },
      });
    });

    this.logger.log(
      `Category soft-deleted: ${categoryId} — reassigned ${budgetCount + recurringCount + reminderCount} references to ${newCategoryId ?? 'none'}`,
    );
  }
}
