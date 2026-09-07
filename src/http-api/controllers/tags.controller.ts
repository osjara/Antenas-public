import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagsService } from '../../tags/tags.service';
import { TagReadingsRepository } from '../../database/tag-readings.repository';
import { TagFilterDto } from '../../tags/dto/tag-filter.dto';
import { ConsumeTagsDto } from '../../database/dto/consume-tags.dto';
import { TagFilterQuery } from '../../common/decorators/tag-filter-query.decorator';
import { toInt } from '../../common/utils/to-int.util';

// All /api/tags* routes live in a single controller, with the :id handler
// declared LAST. Express/Nest match routes in declaration order, so pending/
// consume/consumed would otherwise be swallowed by the :id handler (plan risk R1).
@ApiTags('tags')
@Controller('api/tags')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(
    private readonly tagsService: TagsService,
    private readonly tagReadingsRepository: TagReadingsRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tags with filters' })
  @TagFilterQuery()
  @ApiOkResponse({ description: 'Tag list' })
  findAll(@Query() filters: TagFilterDto) {
    return this.tagsService.findAll(filters);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all in-memory tags' })
  @ApiOkResponse({ description: 'Data cleared' })
  clear() {
    const cleared = this.tagsService.clear();
    return { ok: true, cleared, totalTags: 0, timestamp: new Date().toISOString() };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener tags pendientes (no consumidos por BTP)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'default 1000' })
  @ApiOkResponse({ description: 'Lista de tags con consumed=0' })
  getPending(@Query('limit') limitParam?: string) {
    const limit = Math.max(1, Math.min(10000, toInt(limitParam, 1000)));
    const data = this.tagReadingsRepository.getPendingTags(limit);
    return { total: data.length, limit, data };
  }

  @Post('consume')
  @ApiOperation({ summary: 'Marcar tags como consumidos por BTP' })
  @ApiBody({ type: ConsumeTagsDto })
  @ApiOkResponse({ description: 'Tags marcados como consumidos' })
  consume(@Body() body: ConsumeTagsDto) {
    const validIds = body.ids.filter((id) => Number.isInteger(Number(id))).map(Number);
    if (validIds.length === 0) {
      throw new BadRequestException('ningún id válido recibido');
    }

    this.tagReadingsRepository.markConsumed(validIds);
    this.logger.log(`[DB] tags marcados como consumidos count=${validIds.length}`);
    return { ok: true, consumed: validIds.length };
  }

  @Delete('consumed')
  @ApiOperation({ summary: 'Eliminar registros ya consumidos por BTP' })
  @ApiOkResponse({ description: 'Registros eliminados' })
  deleteConsumed() {
    const deleted = this.tagReadingsRepository.clearConsumed();
    this.logger.log(`[DB] registros consumidos eliminados deleted=${deleted}`);
    return { ok: true, deleted };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one tag by decimal key or tagid' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Tag found' })
  findOne(@Param('id') id: string) {
    const match = this.tagsService.findOne(id);
    if (!match) {
      throw new NotFoundException({ error: 'Tag not found', id });
    }
    return match;
  }
}
