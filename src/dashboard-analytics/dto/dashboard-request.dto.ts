import { IsEnum, IsNotEmpty } from 'class-validator';
import { DashboardFilter } from '../types/analytics.types';

export class DashboardRequestDto {
  @IsEnum(DashboardFilter)
  @IsNotEmpty()
  filter: DashboardFilter;
}
