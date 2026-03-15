import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { BudgetFrequency } from '../../../generated/prisma/client';

export class CreateRecurringBudgetDto {
  @IsString()
  @IsNotEmpty({ message: 'Budget category is required' })
  budgetCategoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BudgetFrequency)
  @IsNotEmpty({ message: 'Frequency is required' })
  frequency: BudgetFrequency;

  @IsInt()
  @Min(1, { message: 'Frequency interval must be at least 1' })
  @IsOptional()
  frequencyInterval?: number = 1;

  @IsDateString({}, { message: 'Start date must be a valid ISO date' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  @IsOptional()
  endDate?: string;
}
