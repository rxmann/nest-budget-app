import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardRequestDto } from './dto/dashboard-request.dto';
import {
  DashboardResponseDto,
  CashFlowResponseDto,
  TreeMapResponseDto,
  TreeNodeDto,
  ExpenseDistributionDto,
  MetricCardDto,
  RecurringMetricCardDto,
  ReminderMetricCardDto,
} from './dto/dashboard-response.dto';
import { Trend, INCOME_TYPES, EXPENSE_TYPES } from './types/analytics.types';
import { calculateDateRange } from './utils/filter.util';
import {
  resolveGranularity,
  getGranularityConfig,
} from './utils/granularity.util';
import { runBudgetSummaryQuery } from './queries/budget-summary.query';
import { runCashFlowQuery } from './queries/cashflow.query';
import { runBudgetCompositionQuery } from './queries/budget-composition.query';
import { runExpenseDistributionQuery } from './queries/expense-distribution.query';
import { runReminderMetricsQuery } from './queries/reminder-metrics.query';
import { CurrentUserType } from 'src/auth/decorators/current-user.decorator';
import { toDisplayAmount } from 'src/budget/utils/budget.util';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Dashboard summary ─────────────────────────────────────────────────────

  async getDashboardAnalytics(
    user: CurrentUserType,
    dto: DashboardRequestDto,
  ): Promise<DashboardResponseDto> {
    this.logger.log(
      `Dashboard analytics for user: ${user.id} filter: ${dto.filter}`,
    );

    const range = calculateDateRange(dto.filter);

    const [summary, recurring, reminders] = await Promise.all([
      runBudgetSummaryQuery(
        this.prisma,
        user.id,
        range.startDate,
        range.endDate,
        range.prevStartDate,
        range.prevEndDate,
        INCOME_TYPES,
        EXPENSE_TYPES,
      ),
      this.prisma.budget.aggregate({
        where: {
          userId: user.id,
          recurringBudgetId: { not: null },
          budgetDate: { gte: range.startDate, lt: range.endDate },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      runReminderMetricsQuery(this.prisma, user.id),
    ]);

    const currentIncome = toDisplayAmount(summary.currentincome ?? 0n);
    const previousIncome = toDisplayAmount(summary.previousincome ?? 0n);
    const currentExpense = toDisplayAmount(summary.currentexpense ?? 0n);
    const previousExpense = toDisplayAmount(summary.previousexpense ?? 0n);

    const incomeCard = this.buildMetricCard(currentIncome, previousIncome);
    const expenseCard = this.buildMetricCard(currentExpense, previousExpense);

    const recurringCard: RecurringMetricCardDto = {
      totalCount: recurring._count.id ?? 0,
      totalSum: toDisplayAmount(recurring._sum.amount ?? 0n),
      message: `${recurring._count.id ?? 0} payments this period`,
    };

    const reminderCard = this.buildReminderCard(reminders);

    const net = currentIncome - currentExpense;

    return {
      income: incomeCard,
      expense: expenseCard,
      recurring: recurringCard,
      reminders: reminderCard,
      net,
    };
  }

  // ─── Cash flow ─────────────────────────────────────────────────────────────

  async getCashFlowAnalytics(
    user: CurrentUserType,
    dto: DashboardRequestDto,
  ): Promise<CashFlowResponseDto[]> {
    const range = calculateDateRange(dto.filter);
    const granularity = resolveGranularity(dto.filter);
    const config = getGranularityConfig(granularity);

    const rows = await runCashFlowQuery(
      this.prisma,
      user.id,
      config,
      range.startDate,
      range.endDate,
    );

    return rows.map((r) => ({
      dateRange: r.daterange,
      period: r.period.toISOString(),
      incomeAmount: toDisplayAmount(r.incomeamount ?? 0n),
      expenseAmount: toDisplayAmount(r.expenseamount ?? 0n),
    }));
  }

  // ─── Budget composition ────────────────────────────────────────────────────

  async getBudgetComposition(
    user: CurrentUserType,
    dto: DashboardRequestDto,
  ): Promise<TreeMapResponseDto> {
    const range = calculateDateRange(dto.filter);

    const rows = await runBudgetCompositionQuery(
      this.prisma,
      user.id,
      range.startDate,
      range.endDate,
    );

    const grouped = new Map<string, TreeNodeDto[]>();

    for (const row of rows) {
      const parentKey = (INCOME_TYPES as readonly string[]).includes(
        row.budgettype,
      )
        ? 'Income'
        : 'Expense';

      const node: TreeNodeDto = {
        name: row.category,
        value: toDisplayAmount(row.amount ?? 0n),
        percentage: row.amountpct,
      };

      const existing = grouped.get(parentKey) ?? [];
      grouped.set(parentKey, [...existing, node]);
    }

    return {
      name: 'Budget Composition',
      children: [
        { name: 'Income', children: grouped.get('Income') ?? [] },
        { name: 'Expense', children: grouped.get('Expense') ?? [] },
      ],
    };
  }

  // ─── Expense distribution ──────────────────────────────────────────────────

  async getExpenseDistribution(
    user: CurrentUserType,
    dto: DashboardRequestDto,
  ): Promise<ExpenseDistributionDto[]> {
    const range = calculateDateRange(dto.filter);
    const granularity = resolveGranularity(dto.filter);
    const config = getGranularityConfig(granularity);

    const rows = await runExpenseDistributionQuery(
      this.prisma,
      user.id,
      config,
      range.startDate,
      range.endDate,
    );

    return rows.map((r) => ({
      periodStr: r.periodstr,
      period: r.period.toISOString(),
      category: r.category,
      amount: toDisplayAmount(r.amount ?? 0n),
    }));
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private buildMetricCard(current: number, previous: number): MetricCardDto {
    const comparison = current - previous;
    const trend =
      comparison > 0 ? Trend.UP : comparison < 0 ? Trend.DOWN : Trend.FLAT;
    const pctChange = this.calculatePercentageChange(current, previous);

    return {
      current,
      previous,
      trend,
      percentageChange: pctChange,
      message: `Trend is ${trend} with a ${pctChange}% change`,
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private buildReminderCard(raw: {
    overdue: bigint;
    duesoon: bigint;
    total: bigint;
    nextduedate: Date | null;
  }): ReminderMetricCardDto {
    const overdue = Number(raw.overdue ?? 0n);
    const dueSoon = Number(raw.duesoon ?? 0n);
    const total = Number(raw.total ?? 0n);
    const nextDate = raw.nextduedate?.toISOString() ?? null;

    return {
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      totalReminders: total,
      nextDueDate: nextDate,
      message: this.generateReminderMessage(overdue, dueSoon, nextDate),
    };
  }

  private generateReminderMessage(
    overdue: number,
    dueSoon: number,
    nextDate: string | null,
  ): string {
    if (overdue > 0) {
      return `${overdue} item${overdue > 1 ? 's' : ''} overdue`;
    }
    if (dueSoon > 0) {
      const dateStr = nextDate
        ? new Date(nextDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : 'soon';
      return `${dueSoon} item${dueSoon > 1 ? 's' : ''} due ${dateStr}`;
    }
    return 'All on track';
  }
}
