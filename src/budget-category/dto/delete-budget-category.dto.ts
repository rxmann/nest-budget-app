import { IsOptional, IsString } from 'class-validator';

export class DeleteBudgetCategoryDto {
  @IsString()
  @IsOptional()
  newCategoryId?: string;
}
