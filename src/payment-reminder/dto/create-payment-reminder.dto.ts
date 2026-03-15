import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  BudgetFrequency,
  ReminderStatus,
} from '../../../generated/prisma/client';

export class CreatePaymentReminderDto {
  @IsString()
  @IsNotEmpty({ message: 'Budget category is required' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Reminder name is required' })
  reminderName: string;

  @IsEnum(BudgetFrequency)
  @IsNotEmpty({ message: 'Frequency is required' })
  frequency: BudgetFrequency;

  @IsDateString({}, { message: 'Next due date must be a valid ISO date' })
  nextDueDate: string;

  @IsEnum(ReminderStatus)
  @IsOptional()
  status?: ReminderStatus = ReminderStatus.ACTIVE;
}
