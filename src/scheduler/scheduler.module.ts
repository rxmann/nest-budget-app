import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringBudgetScheduler } from './recurring-budget.scheduler';
import { PaymentReminderScheduler } from './payment-reminder.scheduler';
import { RecurringBudgetModule } from '../recurring-budget/recurring-budget.module';
import { PaymentReminderModule } from '../payment-reminder/payment-reminder.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RecurringBudgetModule,
    PaymentReminderModule,
    BudgetModule,
  ],
  providers: [RecurringBudgetScheduler, PaymentReminderScheduler],
})
export class SchedulerModule {}
