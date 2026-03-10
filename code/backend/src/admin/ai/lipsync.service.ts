import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const POLL_INTERVAL_MS = 5_000;

@Injectable()
export class LipsyncService {
  private readonly logger = new Logger(LipsyncService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  async generate(videoUrl: string, audioUrl: string): Promise<string> {
    this.logger.log(`Submitting lipsync job (video=${videoUrl.slice(0, 60)}...)`);

    // Step 1: Submit to queue
    const submitResponse = await fetch('https://queue.fal.run/veed/lipsync', {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_url: videoUrl, audio_url: audioUrl }),
    });

    if (!submitResponse.ok) {
      const body = await submitResponse.text();
      this.logger.error(`Lipsync submit failed: ${submitResponse.status} ${body}`);
      throw new Error(`Lipsync submission failed: ${submitResponse.status}`);
    }

    const submitResult = await submitResponse.json();
    const requestId = submitResult.request_id;
    if (!requestId) {
      throw new Error('Lipsync submission returned no request_id');
    }

    this.logger.log(`Lipsync job submitted: ${requestId}`);

    // Step 2: Poll until complete
    const startTime = Date.now();
    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
      await this.sleep(POLL_INTERVAL_MS);

      const statusResponse = await fetch(
        `https://queue.fal.run/veed/lipsync/requests/${requestId}/status`,
        { headers: { Authorization: `Key ${this.falKey}` } },
      );

      if (!statusResponse.ok) {
        this.logger.warn(`Lipsync status poll failed: ${statusResponse.status}`);
        continue;
      }

      const statusResult = await statusResponse.json();
      this.logger.debug(`Lipsync status: ${JSON.stringify(statusResult)}`);

      if (statusResult.status === 'COMPLETED') {
        break;
      }
      if (statusResult.status === 'FAILED') {
        throw new Error(`Lipsync failed: ${statusResult.error || 'unknown error'}`);
      }
    }

    if (Date.now() - startTime >= MAX_POLL_DURATION_MS) {
      throw new Error('Lipsync timed out after 10 minutes');
    }

    // Step 3: Fetch result
    const resultResponse = await fetch(
      `https://queue.fal.run/veed/lipsync/requests/${requestId}`,
      { headers: { Authorization: `Key ${this.falKey}` } },
    );

    if (!resultResponse.ok) {
      const body = await resultResponse.text();
      this.logger.error(`Lipsync result fetch failed: ${resultResponse.status} ${body}`);
      throw new Error(`Lipsync result fetch failed: ${resultResponse.status}`);
    }

    const resultData = await resultResponse.json();
    const videoResultUrl = resultData.video?.url || resultData.video_url || resultData.output?.url || resultData.url;

    if (!videoResultUrl || typeof videoResultUrl !== 'string') {
      this.logger.error('Lipsync returned no video URL', resultData);
      throw new Error('Lipsync returned no video URL');
    }

    this.logger.log(`Lipsync completed: ${videoResultUrl}`);
    return videoResultUrl;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
