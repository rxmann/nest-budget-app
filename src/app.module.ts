import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppLoggerModule } from './logger/logger.module';
import { BudgetModule } from './budget/budget.module';
import { appConfig } from './config/app.config';
import { googleConfig } from './config/google.config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './auth/auth.module';
import { BudgetCategoryModule } from './budget-category/budget-category.module';
import { RecurringBudgetModule } from './recurring-budget/recurring-budget.module';
import { PaymentReminderModule } from './payment-reminder/payment-reminder.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { DashboardModule } from './dashboard-analytics/dashboard.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './auth/guards/jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, googleConfig],
    }),
    AppLoggerModule,
    PrismaModule,
    BudgetModule,
    AuthModule,
    BudgetCategoryModule,
    RecurringBudgetModule,
    PaymentReminderModule,
    SchedulerModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {}
