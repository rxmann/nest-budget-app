import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringBudgetService } from '../recurring-budget/recurring-budget.service';
import { getNextOccurrence } from '../recurring-budget/utils/recurrence.util';

@Injectable()
export class RecurringBudgetScheduler {
  private readonly logger = new Logger(RecurringBudgetScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recurringBudget: RecurringBudgetService,
  ) {}

  // runs at 00:00:10 every day
  @Cron('10 0 0 * * *', { name: 'process-recurring-budgets' })
  async processRecurringBudgets(): Promise<void> {
    this.logger.log('Recurring budget job started');

    const dueBudgets = await this.recurringBudget.findDueRecurringBudgets();

    if (!dueBudgets.length) {
      this.logger.warn('No recurring budgets due today');
      return;
    }

    this.logger.log(`Found ${dueBudgets.length} due recurring budgets`);

    for (const rb of dueBudgets) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. create actual budget entry
          await tx.budget.create({
            data: {
              userId: rb.userId,
              budgetCategoryId: rb.budgetCategoryId,
              name: rb.name ?? rb.description ?? '',
              amount: rb.amount,
              currency: rb.currency,
              budgetDate: new Date(),
              isRecurring: true,
              recurringBudgetId: rb.id,
              tags: [],
              createdBy: rb.userId,
              lastModifiedBy: rb.userId,
            },
          });

          // 2. advance next occurrence
          const nextOccurrence = getNextOccurrence(
            rb.nextOccurrence ?? new Date(),
            rb.frequency,
          );

          // 3. update recurring budget
          await tx.recurringBudget.update({
            where: { id: rb.id },
            data: { nextOccurrence },
          });

          this.logger.log(
            `Recurring budget ${rb.id} processed → next: ${nextOccurrence?.toISOString() ?? 'null (ONE_TIME)'}`,
          );
        });
      } catch (err) {
        // log and continue — one failure should not block others
        this.logger.error(
          `Failed to process recurring budget ${rb.id}: ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }

    this.logger.log('Recurring budget job completed');
  }
}
