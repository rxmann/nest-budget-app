import { PrismaService } from '../../prisma/prisma.service';
import { GranularityConfig } from '../types/analytics.types';
import { Prisma } from '../../../generated/prisma/client';

export type ExpenseDistributionRaw = {
  periodstr: string;
  period: Date;
  category: string;
  amount: bigint;
};

export async function runExpenseDistributionQuery(
  prisma: PrismaService,
  userId: string,
  config: GranularityConfig,
  startDate: Date,
  endDate: Date,
): Promise<ExpenseDistributionRaw[]> {
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
        bc.name                                         AS category,
        SUM(b.amount)                                   AS amount
      FROM budgets b
      JOIN budget_categories bc ON bc.id = b.budget_category_id
      WHERE b.user_id = ${userId}
        AND bc.budget_type IN ('EXPENSE', 'LEND', 'EXTRA')
        AND b.budget_date >= ${startDate}
        AND b.budget_date <  ${endDate}
      GROUP BY 1, 2
    )
    SELECT
      to_char(df.period, ${config.labelFormat})  AS periodStr,
      df.period::date                            AS period,
      COALESCE(bd.category, 'Other')             AS category,
      COALESCE(bd.amount, 0)                     AS amount
    FROM date_filler df
    LEFT JOIN base_data bd ON bd.period = df.period
    ORDER BY df.period, category
  `;

  return prisma.$queryRaw<ExpenseDistributionRaw[]>(sql);
}
