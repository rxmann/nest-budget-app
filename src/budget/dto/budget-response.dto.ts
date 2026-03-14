export class BudgetResponseDto {
  id: string;
  name: string;
  amount: number;
  currency: string;
  budgetType: string;
  budgetCategoryId: string;
  budgetCategoryName: string;
  budgetDate: string;
  receiptUrl: string | null;
  tags: string[];
  isRecurring: boolean;
  version: number;
  createdAt: string;
}