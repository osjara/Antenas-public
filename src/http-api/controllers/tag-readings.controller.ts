import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagReadingsRepository } from '../../database/tag-readings.repository';
import { DbTagFilterDto } from '../../database/dto/db-tag-filter.dto';
import { DbTagFilterQuery } from '../../common/decorators/tag-filter-query.decorator';

@ApiTags('db')
@Controller('api/db')
export class TagReadingsController {
  constructor(private readonly tagReadingsRepository: TagReadingsRepository) {}

  @Get('tags')
  @ApiOperation({
    summary: 'Consultar tabla tag_readings en SQLite',
    description:
      'Permite filtrar y paginar todos los registros persistidos en la base de datos local.',
  })
  @DbTagFilterQuery()
  @ApiOkResponse({ description: 'Registros de tag_readings con total, offset, limit y data[]' })
  findAll(@Query() filters: DbTagFilterDto) {
    return this.tagReadingsRepository.queryDbTags(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de la base de datos SQLite' })
  @ApiOkResponse({ description: 'Total, pendientes y consumidos' })
  getStats() {
    return { ...this.tagReadingsRepository.getDbStats(), timestamp: new Date().toISOString() };
  }
}
