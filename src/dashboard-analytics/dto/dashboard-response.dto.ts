import { Trend } from '../types/analytics.types';

export type MetricCardDto = {
  current: number;
  previous: number;
  trend: Trend;
  percentageChange: number;
  message: string;
};

export type RecurringMetricCardDto = {
  totalCount: number;
  totalSum: number;
  message: string;
};

export type ReminderMetricCardDto = {
  overdueCount: number;
  dueSoonCount: number;
  totalReminders: number;
  nextDueDate: string | null;
  message: string;
};

export type DashboardResponseDto = {
  income: MetricCardDto;
  expense: MetricCardDto;
  recurring: RecurringMetricCardDto;
  reminders: ReminderMetricCardDto;
  net: number;
};

export type CashFlowResponseDto = {
  dateRange: string;
  period: string;
  incomeAmount: number;
  expenseAmount: number;
};

export type BudgetCompositionRowDto = {
  category: string;
  budgetType: string;
  amount: number;
  amountPct: number;
};

export type TreeNodeDto = {
  name: string;
  value?: number;
  percentage?: number;
  children?: TreeNodeDto[];
};

export type TreeMapResponseDto = {
  name: string;
  children: TreeNodeDto[];
};

export type ExpenseDistributionDto = {
  periodStr: string;
  period: string;
  category: string;
  amount: number;
};
