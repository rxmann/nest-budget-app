import { Controller, Get, Logger, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardRequestDto } from './dto/dashboard-request.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/auth/decorators/current-user.decorator';

@Controller('dashboard/analytics')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: DashboardRequestDto,
  ) {
    return this.dashboardService.getDashboardAnalytics(user, dto);
  }

  @Get('cashflow')
  getCashFlow(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: DashboardRequestDto,
  ) {
    return this.dashboardService.getCashFlowAnalytics(user, dto);
  }

  @Get('budget-composition')
  getBudgetComposition(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: DashboardRequestDto,
  ) {
    return this.dashboardService.getBudgetComposition(user, dto);
  }

  @Get('expense-distribution')
  getExpenseDistribution(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: DashboardRequestDto,
  ) {
    return this.dashboardService.getExpenseDistribution(user, dto);
  }
}
