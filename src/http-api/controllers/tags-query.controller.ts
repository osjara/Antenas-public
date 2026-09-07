import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagsService } from '../../tags/tags.service';
import { TagFilterDto } from '../../tags/dto/tag-filter.dto';

@ApiTags('tags')
@Controller('api')
export class TagsQueryController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Tag statistics' })
  @ApiOkResponse({ description: 'Current in-memory counters' })
  getStats() {
    return {
      totalTags: this.tagsService.count(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('query')
  @ApiOperation({ summary: 'Manual query by JSON payload' })
  @ApiBody({ type: TagFilterDto, required: false })
  @ApiOkResponse({ description: 'Filtered tag list' })
  query(@Body() filters: TagFilterDto) {
    return this.tagsService.findAll(filters || {});
  }
}
