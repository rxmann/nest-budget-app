import { BudgetType } from '../../../generated/prisma/client';

export class BudgetCategoryResponseDto {
  id: string;
  name: string;
  notes: string | null;
  budgetType: BudgetType;
  isActive: boolean;
  updatedAt: string;
}
