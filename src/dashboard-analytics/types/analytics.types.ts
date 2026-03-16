export enum DashboardFilter {
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
}

export enum Granularity {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
}

export type GranularityConfig = {
  interval: string;
  truncUnit: string;
  labelFormat: string;
};

export const GRANULARITY_CONFIG: Record<Granularity, GranularityConfig> = {
  [Granularity.DAILY]: {
    interval: '1 day',
    truncUnit: 'day',
    labelFormat: 'DD Mon',
  },
  [Granularity.MONTHLY]: {
    interval: '1 month',
    truncUnit: 'month',
    labelFormat: 'Mon YYYY',
  },
};

export type DateRange = {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
};

export enum Trend {
  UP = 'Up',
  DOWN = 'Down',
  FLAT = 'Flat',
}

// income-like budget types
export const INCOME_TYPES = [
  'INCOME',
  'SAVINGS',
  'INVESTMENT',
  'LOAN',
] as const;
// expense-like budget types
export const EXPENSE_TYPES = ['EXPENSE', 'LEND', 'EXTRA'] as const;
