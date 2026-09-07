import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import configuration from '../config/configuration';
import { ParsedTag } from '../protocol/interfaces/parsed-tag.interface';

@Injectable()
export class ForwardTagService {
  private readonly logger = new Logger(ForwardTagService.name);

  constructor(
    @Inject(configuration.KEY) private readonly config: ConfigType<typeof configuration>,
  ) {}

  async forward(tag: ParsedTag): Promise<void> {
    if (!this.config.forwardTagUrl) {
      return;
    }

    const payload = {
      serial: tag.device || '',
      tagid: tag.tagid || '',
      tlvtype: tag.tlvtype || '',
      canal: Number.isFinite(tag.antenna) ? tag.antenna : 0,
      intensidad: Number.isFinite(tag.intensity) ? tag.intensity : 0,
      in_out: Number.isFinite(tag.entry) ? tag.entry : 0,
      stay: Number.isFinite(tag.staying) ? tag.staying : 0,
      hora: tag.time || '',
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.httpTimeoutMs);
    try {
      const response = await fetch(this.config.forwardTagUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.log(`[HTTP] forward failed status=${response.status}`);
      }
    } catch (error) {
      this.logger.log(`[HTTP] forward error error=${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
