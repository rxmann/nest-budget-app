import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class AcknowledgeReminderDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Budget date is required' })
  budgetDate: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receiptUrl?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
