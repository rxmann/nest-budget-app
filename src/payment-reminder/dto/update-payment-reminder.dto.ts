import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentReminderDto } from './create-payment-reminder.dto';

export class UpdatePaymentReminderDto extends PartialType(
  CreatePaymentReminderDto,
) {}
