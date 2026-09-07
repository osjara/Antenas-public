import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { TagFilterDto } from '../../tags/dto/tag-filter.dto';
import { EmptyToUndefined } from '../../common/utils/empty-to-undefined.transform';

export class DbTagFilterDto extends TagFilterDto {
  @ApiPropertyOptional({ description: '0 = pendiente, 1 = consumido por BTP', enum: [0, 1] })
  @IsOptional()
  @EmptyToUndefined()
  consumed?: number | string;
}
