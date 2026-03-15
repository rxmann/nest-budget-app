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
} from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';
import { BudgetCategoryQueryDto } from './dto/budget-category-query.dto';
import {
  CurrentUser,
  CurrentUserType,
} from 'src/auth/decorators/current-user.decorator';

@Controller('budget-categories')
export class BudgetCategoryController {
  constructor(private readonly budgetCategoryService: BudgetCategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateBudgetCategoryDto,
  ) {
    return this.budgetCategoryService.createCategory(user, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: BudgetCategoryQueryDto,
  ) {
    return this.budgetCategoryService.getAllCategories(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.budgetCategoryService.getCategoryById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetCategoryDto,
  ) {
    return this.budgetCategoryService.updateCategory(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.budgetCategoryService.deleteCategory(user, id);
  }
}
