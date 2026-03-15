import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { PaymentReminderService } from './payment-reminder.service';
import { CreatePaymentReminderDto } from './dto/create-payment-reminder.dto';
import { UpdatePaymentReminderDto } from './dto/update-payment-reminder.dto';
import { AcknowledgeReminderDto } from './dto/acknowledge-reminder.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/auth/decorators/current-user.decorator';

@Controller('payment-reminders')
export class PaymentReminderController {
  constructor(
    private readonly paymentReminderService: PaymentReminderService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserType) {
    return this.paymentReminderService.getAllPaymentReminders(user);
  }

  @Get('upcoming')
  upcoming(@CurrentUser() user: CurrentUserType) {
    return this.paymentReminderService.getUpcomingReminders(user);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: CurrentUserType) {
    return this.paymentReminderService.getRemindersToNotify(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePaymentReminderDto,
  ) {
    return this.paymentReminderService.createPaymentReminder(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentReminderDto,
  ) {
    return this.paymentReminderService.updatePaymentReminder(user, id, dto);
  }

  @Patch(':id/snooze')
  snooze(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.paymentReminderService.snoozeReminder(user, id);
  }

  @Patch(':id/acknowledge')
  acknowledge(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: AcknowledgeReminderDto,
  ) {
    return this.paymentReminderService.acknowledgeReminder(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.paymentReminderService.deletePaymentReminder(user, id);
  }
}
