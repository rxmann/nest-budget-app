import { Module } from '@nestjs/common';
import { BudgetCategoryController } from './budget-category.controller';
import { BudgetCategoryService } from './budget-category.service';

@Module({
  controllers: [BudgetCategoryController],
  providers: [BudgetCategoryService],
  exports: [BudgetCategoryService], // budget module may need this later
})
export class BudgetCategoryModule {}
