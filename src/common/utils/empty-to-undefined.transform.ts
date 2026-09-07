import { Transform } from 'class-transformer';

// The legacy filters treat '' (an empty query/body value) as "no filter applied".
// Without this, ValidationPipe's implicit number conversion would turn '' into 0
// and start filtering on entry/staying/consumed = 0 unintentionally (see plan risk R4).
export function EmptyToUndefined() {
  return Transform(({ value }) => (value === '' || value === null ? undefined : value));
}
