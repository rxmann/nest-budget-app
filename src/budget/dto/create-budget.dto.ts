import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateBudgetDto {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must have max 2 decimal places' },
  )
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsDateString({}, { message: 'Budget date must be a valid ISO date' })
  budgetDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Budget category ID is required' })
  budgetCategoryId: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receiptUrl?: string;

  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;
}