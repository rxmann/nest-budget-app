import { Module } from '@nestjs/common';
import { PaymentReminderController } from './payment-reminder.controller';
import { PaymentReminderService } from './payment-reminder.service';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [BudgetModule], // needs BudgetService for acknowledge
  controllers: [PaymentReminderController],
  providers: [PaymentReminderService],
  exports: [PaymentReminderService], // cron module needs findRemindersToNotify
})
export class PaymentReminderModule {}
