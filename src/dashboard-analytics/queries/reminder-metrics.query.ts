import { PrismaService } from '../../prisma/prisma.service';

export type ReminderMetricsRaw = {
  overdue: bigint;
  duesoon: bigint;
  total: bigint;
  nextduedate: Date | null;
};

export async function runReminderMetricsQuery(
  prisma: PrismaService,
  userId: string,
): Promise<ReminderMetricsRaw> {
  const result = await prisma.$queryRaw<ReminderMetricsRaw[]>`
    SELECT
      COALESCE(SUM(CASE
        WHEN pr.next_due_date < CURRENT_DATE AND pr.status = 'ACTIVE'
        THEN 1 ELSE 0 END), 0)                                          AS overdue,

      COALESCE(SUM(CASE
        WHEN pr.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND pr.status = 'ACTIVE'
        THEN 1 ELSE 0 END), 0)                                          AS dueSoon,

      COALESCE(SUM(CASE
        WHEN pr.status = 'ACTIVE' THEN 1 ELSE 0 END), 0)               AS total,

      MIN(CASE
        WHEN pr.next_due_date >= CURRENT_DATE AND pr.status = 'ACTIVE'
        THEN pr.next_due_date ELSE NULL END)                            AS nextDueDate

    FROM payment_reminders pr
    WHERE pr.user_id = ${userId}
  `;

  return result[0];
}
