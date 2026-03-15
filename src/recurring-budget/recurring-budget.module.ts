import { Module } from '@nestjs/common';
import { RecurringBudgetController } from './recurring-budget.controller';
import { RecurringBudgetService } from './recurring-budget.service';

@Module({
  controllers: [RecurringBudgetController],
  providers: [RecurringBudgetService],
  exports: [RecurringBudgetService], // cron job module will need this
})
export class RecurringBudgetModule {}
