import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigType } from '@nestjs/config';
import configuration from '../../config/configuration';

@ApiTags('health')
@Controller('api')
export class HealthController {
  constructor(
    @Inject(configuration.KEY) private readonly config: ConfigType<typeof configuration>,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Service status' })
  getHealth() {
    return {
      ok: true,
      tcpHost: this.config.host,
      tcpPort: this.config.port,
      httpPort: this.config.httpPort,
      timestamp: new Date().toISOString(),
    };
  }
}
