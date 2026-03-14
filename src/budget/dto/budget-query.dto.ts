import { IsInt, IsOptional, IsIn, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import {
  BUDGET_SORTABLE_FIELDS,
  BudgetSortableField,
  SortOrder,
} from '../types/budget.types';

export class BudgetQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(BUDGET_SORTABLE_FIELDS)
  sortBy?: BudgetSortableField;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder;
}