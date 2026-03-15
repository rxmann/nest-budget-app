import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringBudgetDto } from './create-recurring-budget.dto';

export class UpdateRecurringBudgetDto extends PartialType(
  CreateRecurringBudgetDto,
) {}
