import { PrismaService } from '../../prisma/prisma.service';

export type BudgetCompositionRaw = {
  category: string;
  budgettype: string;
  amount: bigint;
  amountpct: number;
};

export async function runBudgetCompositionQuery(
  prisma: PrismaService,
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<BudgetCompositionRaw[]> {
  return prisma.$queryRaw<BudgetCompositionRaw[]>`
    SELECT
      bc.name                                                          AS category,
      bc.budget_type                                                   AS budgetType,
      SUM(b.amount)                                                    AS amount,
      SUM(b.amount) * 100.0 /
        SUM(SUM(b.amount)) OVER (PARTITION BY bc.budget_type)         AS amountPct
    FROM budgets b
    JOIN budget_categories bc ON bc.id = b.budget_category_id
    WHERE b.user_id    = ${userId}
      AND b.budget_date >= ${startDate}
      AND b.budget_date <  ${endDate}
    GROUP BY bc.name, bc.budget_type
  `;
}
