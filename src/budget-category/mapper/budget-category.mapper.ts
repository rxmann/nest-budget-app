import { BudgetCategory } from '../../../generated/prisma/client';
import { BudgetCategoryResponseDto } from '../dto/budget-category-response.dto';

export function toBudgetCategoryResponse(
  category: BudgetCategory,
): BudgetCategoryResponseDto {
  return {
    id: category.id,
    name: category.name,
    notes: category.notes ?? null,
    budgetType: category.budgetType,
    isActive: category.isActive,
    updatedAt: category.updatedAt.toISOString(),
  };
}
