import {
  DashboardFilter,
  Granularity,
  GRANULARITY_CONFIG,
  GranularityConfig,
} from '../types/analytics.types';

export function resolveGranularity(filter: DashboardFilter): Granularity {
  switch (filter) {
    case DashboardFilter.THIS_WEEK:
    case DashboardFilter.THIS_MONTH:
      return Granularity.DAILY;

    case DashboardFilter.THIS_QUARTER:
    case DashboardFilter.THIS_YEAR:
      return Granularity.MONTHLY;
  }
}

export function getGranularityConfig(
  granularity: Granularity,
): GranularityConfig {
  return GRANULARITY_CONFIG[granularity];
}
