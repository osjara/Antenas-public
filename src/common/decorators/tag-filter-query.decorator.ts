import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function TagFilterQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'tagid',
      required: false,
      type: String,
      description: 'Filtra por ID de tag (parcial)',
    }),
    ApiQuery({
      name: 'device',
      required: false,
      type: String,
      description: 'Filtra por serial de antena (parcial)',
    }),
    ApiQuery({
      name: 'tlvtype',
      required: false,
      type: String,
      description: 'Filtra por tipo TLV exacto',
      example: '0x8B01',
    }),
    ApiQuery({ name: 'entry', required: false, enum: [0, 1], description: '1 = entró, 0 = salió' }),
    ApiQuery({
      name: 'staying',
      required: false,
      enum: [0, 1],
      description: '1 = permanece, 0 = salió',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Máximo de resultados (default 100, max 1000)',
    }),
    ApiQuery({ name: 'offset', required: false, type: Number, description: 'Paginación' }),
  );
}

export function DbTagFilterQuery() {
  return applyDecorators(
    TagFilterQuery(),
    ApiQuery({
      name: 'consumed',
      required: false,
      enum: [0, 1],
      description: '0 = pendiente, 1 = consumido por BTP',
    }),
  );
}
