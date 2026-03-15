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
  Query,
} from '@nestjs/common';
import { RecurringBudgetService } from './recurring-budget.service';
import { CreateRecurringBudgetDto } from './dto/create-recurring-budget.dto';
import { UpdateRecurringBudgetDto } from './dto/update-recurring-budget.dto';
import { RecurringBudgetQueryDto } from './dto/recurring-budget-query.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/auth/decorators/current-user.decorator';

@Controller('recurring-budgets')
export class RecurringBudgetController {
  constructor(
    private readonly recurringBudgetService: RecurringBudgetService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: RecurringBudgetQueryDto,
  ) {
    return this.recurringBudgetService.getRecurringBudgets(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.recurringBudgetService.getRecurringBudget(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateRecurringBudgetDto,
  ) {
    return this.recurringBudgetService.createRecurringBudget(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringBudgetDto,
  ) {
    return this.recurringBudgetService.updateRecurringBudget(user, id, dto);
  }

  @Patch(':id/disable')
  disable(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.recurringBudgetService.disableRecurringBudget(user, id);
  }

  @Patch(':id/enable')
  enable(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.recurringBudgetService.enableRecurringBudget(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.recurringBudgetService.deleteRecurringBudget(user, id);
  }
}
