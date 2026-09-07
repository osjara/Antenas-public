import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { EmptyToUndefined } from '../../common/utils/empty-to-undefined.transform';

// Values stay as the raw strings sent by the client (query or body) — numeric
// coercion/clamping happens where the filter is applied, exactly like the
// original toInt()-based logic, so malformed input keeps falling back to
// defaults instead of turning into a 400.
export class TagFilterDto {
  @ApiPropertyOptional({ description: 'Filtra por ID de tag (parcial)' })
  @IsOptional()
  @EmptyToUndefined()
  tagid?: string;

  @ApiPropertyOptional({ description: 'Filtra por serial de antena (parcial)' })
  @IsOptional()
  @EmptyToUndefined()
  device?: string;

  @ApiPropertyOptional({ description: 'Filtra por tipo TLV exacto', example: '0x8B01' })
  @IsOptional()
  @EmptyToUndefined()
  tlvtype?: string;

  @ApiPropertyOptional({ description: '1 = entró, 0 = salió', enum: [0, 1] })
  @IsOptional()
  @EmptyToUndefined()
  entry?: number | string;

  @ApiPropertyOptional({ description: '1 = permanece, 0 = salió', enum: [0, 1] })
  @IsOptional()
  @EmptyToUndefined()
  staying?: number | string;

  @ApiPropertyOptional({ description: 'Máximo de resultados', default: 100 })
  @IsOptional()
  @EmptyToUndefined()
  limit?: number | string;

  @ApiPropertyOptional({ description: 'Paginación', default: 0 })
  @IsOptional()
  @EmptyToUndefined()
  offset?: number | string;
}
