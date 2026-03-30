import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const HEADER = 'x-pipeline-demo-key';

/**
 * Protects public “trader demo” routes. Requires PIPELINE_DEMO_KEY in env and a matching header.
 */
@Injectable()
export class PipelineDemoGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const key = this.configService.get<string>('PIPELINE_DEMO_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Pipeline demo is not enabled (PIPELINE_DEMO_KEY is not set).',
      );
    }
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = req.headers[HEADER] ?? req.headers[HEADER.toUpperCase()];
    if (header !== key) {
      throw new ForbiddenException('Invalid or missing pipeline demo key');
    }
    return true;
  }
}
