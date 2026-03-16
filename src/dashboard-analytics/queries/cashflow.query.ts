import { PrismaService } from '../../prisma/prisma.service';
import { GranularityConfig } from '../types/analytics.types';
import { Prisma } from '../../../generated/prisma/client';

export type CashFlowRaw = {
  daterange: string;
  period: Date;
  incomeamount: bigint;
  expenseamount: bigint;
};

export async function runCashFlowQuery(
  prisma: PrismaService,
  userId: string,
  config: GranularityConfig,
  startDate: Date,
  endDate: Date,
): Promise<CashFlowRaw[]> {
  // Prisma.$queryRaw does not support dynamic identifiers
  // using Prisma.sql for safe interpolation of granularity strings
  const sql = Prisma.sql`
    WITH date_filler AS (
      SELECT generate_series(
        date_trunc(${config.truncUnit}, ${startDate}::timestamp),
        date_trunc(${config.truncUnit}, ${endDate}::timestamp - interval '1 day'),
        ${config.interval}::interval
      ) AS period
    ),
    base_data AS (
      SELECT
        date_trunc(${config.truncUnit}, b.budget_date) AS period,
        SUM(CASE WHEN bc.budget_type IN ('INCOME','SAVINGS','INVESTMENT','LOAN') THEN b.amount ELSE 0 END) AS income_amount,
        SUM(CASE WHEN bc.budget_type IN ('EXPENSE','LEND','EXTRA') THEN b.amount ELSE 0 END) AS expense_amount
      FROM budgets b
      JOIN budget_categories bc ON bc.id = b.budget_category_id
      WHERE b.user_id = ${userId}
        AND b.budget_date >= ${startDate}
        AND b.budget_date < ${endDate}
      GROUP BY 1
    )
    SELECT
      to_char(df.period, ${config.labelFormat}) AS dateRange,
      df.period::date                           AS period,
      COALESCE(bd.income_amount,  0)            AS incomeAmount,
      COALESCE(bd.expense_amount, 0)            AS expenseAmount
    FROM date_filler df
    LEFT JOIN base_data bd ON bd.period = df.period
    ORDER BY df.period
  `;

  return prisma.$queryRaw<CashFlowRaw[]>(sql);
}
