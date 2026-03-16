import { PrismaService } from '../../prisma/prisma.service';

export type BudgetSummaryRaw = {
  currentincome: bigint;
  previousincome: bigint;
  currentexpense: bigint;
  previousexpense: bigint;
};

export async function runBudgetSummaryQuery(
  prisma: PrismaService,
  userId: string,
  currentStart: Date,
  currentEnd: Date,
  prevStart: Date,
  prevEnd: Date,
  incomeTypes: readonly string[],
  expenseTypes: readonly string[],
): Promise<BudgetSummaryRaw> {
  const result = await prisma.$queryRaw<BudgetSummaryRaw[]>`
  SELECT
    COALESCE(SUM(CASE
      WHEN b.budget_date >= ${currentStart} AND b.budget_date < ${currentEnd}
        AND bc.budget_type::text = ANY(${incomeTypes}::text[])
      THEN b.amount ELSE 0 END), 0) AS currentIncome,

    COALESCE(SUM(CASE
      WHEN b.budget_date >= ${prevStart} AND b.budget_date < ${prevEnd}
        AND bc.budget_type::text = ANY(${incomeTypes}::text[])
      THEN b.amount ELSE 0 END), 0) AS previousIncome,

    COALESCE(SUM(CASE
      WHEN b.budget_date >= ${currentStart} AND b.budget_date < ${currentEnd}
        AND bc.budget_type::text = ANY(${expenseTypes}::text[])
      THEN b.amount ELSE 0 END), 0) AS currentExpense,

    COALESCE(SUM(CASE
      WHEN b.budget_date >= ${prevStart} AND b.budget_date < ${prevEnd}
        AND bc.budget_type::text = ANY(${expenseTypes}::text[])
      THEN b.amount ELSE 0 END), 0) AS previousExpense

  FROM budgets b
  JOIN budget_categories bc ON bc.id = b.budget_category_id
  WHERE b.user_id = ${userId}
`;
  return result[0];
}
