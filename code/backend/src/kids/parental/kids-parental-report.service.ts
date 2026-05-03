import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KidsParentalService } from './kids-parental.service';
import { FcmService } from '../../fcm/fcm.service';

@Injectable()
export class KidsParentalReportService {
  private readonly logger = new Logger(KidsParentalReportService.name);

  constructor(
    private readonly kidsParentalService: KidsParentalService,
    private readonly fcmService: FcmService,
  ) {}

  /** Runs every Monday at 08:00 to send weekly usage summaries to parents. */
  @Cron('0 8 * * 1', { name: 'weekly-parental-report' })
  async sendWeeklyReports() {
    this.logger.log('Starting weekly parental report job');

    const pairs = await this.kidsParentalService.getAllActiveChildParentPairs();

    const parentReports = new Map<string, { weeklyMinutes: number; topicLines: string[] }>();

    for (const { childId, parentId } of pairs) {
      const report = await this.kidsParentalService.buildWeeklyReportData(childId);
      const existing = parentReports.get(parentId) ?? { weeklyMinutes: 0, topicLines: [] };

      existing.weeklyMinutes += report.weeklyMinutes;

      for (const t of report.quizTopics) {
        existing.topicLines.push(`${t.topic}: ${t.avgScorePct}%`);
      }

      parentReports.set(parentId, existing);
    }

    let sent = 0;
    for (const [parentId, data] of parentReports.entries()) {
      const topicSummary =
        data.topicLines.length > 0
          ? data.topicLines.slice(0, 3).join(', ')
          : 'No quizzes this week';

      const body = `This week: ${data.weeklyMinutes} min watched. Quiz scores — ${topicSummary}.`;

      await this.fcmService.sendNotification(
        parentId,
        "📊 Weekly Learning Summary",
        body,
        { type: 'weekly_report' },
      );

      sent++;
    }

    this.logger.log(`Weekly report job complete — notified ${sent} parent(s)`);
  }
}
