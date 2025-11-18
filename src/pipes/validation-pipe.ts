import {
  PipeTransform,
  BadRequestException,
  ArgumentMetadata,
  Logger,
  Injectable,
} from '@nestjs/common';
import { ZodError, z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);
  constructor(private schema: z.ZodTypeAny) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      this.logger.log(metadata);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.message,
          errors: error,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
