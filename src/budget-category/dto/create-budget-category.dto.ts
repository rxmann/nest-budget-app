import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BudgetType } from '../../../generated/prisma/client';

export class CreateBudgetCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  notes?: string;

  @IsEnum(BudgetType)
  @IsNotEmpty()
  budgetType: BudgetType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
