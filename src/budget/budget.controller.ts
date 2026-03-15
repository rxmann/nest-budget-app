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
  Query,
  UseGuards,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetQueryDto } from './dto/budget-query.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/auth/decorators/current-user.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('budgets')
@UseGuards(JwtGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateBudgetDto) {
    return this.budgetService.createBudget(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: BudgetQueryDto,
  ) {
    return this.budgetService.getAllBudgets(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.budgetService.getBudgetById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.budgetService.deleteBudget(user, id);
  }
}
