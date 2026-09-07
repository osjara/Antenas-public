import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray } from 'class-validator';

// Element-level integer validation happens in the controller (not here), so it
// can keep producing the same "ningún id válido recibido" message the legacy
// endpoint used once ids is a non-empty array but none of its entries are valid.
export class ConsumeTagsDto {
  @ApiProperty({ type: [Number], description: 'IDs de tag_readings a marcar como consumidos' })
  @IsArray({ message: 'ids debe ser un array no vacío de enteros' })
  @ArrayNotEmpty({ message: 'ids debe ser un array no vacío de enteros' })
  ids!: unknown[];
}
