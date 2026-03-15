import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentReminderService } from '../payment-reminder/payment-reminder.service';

@Injectable()
export class PaymentReminderScheduler {
  private readonly logger = new Logger(PaymentReminderScheduler.name);

  constructor(private readonly paymentReminder: PaymentReminderService) {}

  // runs at 08:00 and 09:00 every day
  @Cron('0 0 8,9 * * *', { name: 'process-payment-reminders' })
  async processPaymentReminders(): Promise<void> {
    this.logger.log('Payment reminder job started');

    const reminders = await this.paymentReminder.findRemindersToNotify();

    if (!reminders.length) {
      this.logger.warn('No payment reminders to notify today');
      return;
    }

    this.logger.log(`Found ${reminders.length} reminders to notify`);

    // log each for now — wire push/websocket notifications here later
    for (const reminder of reminders) {
      this.logger.log(
        `Reminder due: id=${reminder.id} name=${reminder.reminderName} daysUntil=${reminder.daysUntilDue}`,
      );
    }

    this.logger.log('Payment reminder job completed');
  }
}
