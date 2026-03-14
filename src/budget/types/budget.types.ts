import { Budget, BudgetCategory } from '../../../generated/prisma/client';

export const BUDGET_SORTABLE_FIELDS = [
  'budgetDate',
  'amount',
  'name',
  'createdAt',
] as const;

export type BudgetSortableField = (typeof BUDGET_SORTABLE_FIELDS)[number];

export type SortOrder = 'asc' | 'desc';

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type BudgetWithCategory = Budget & {
  budgetCategory: BudgetCategory;
};