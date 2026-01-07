import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

type Constructor<T = Record<string, unknown>> = new (...args: any[]) => T;

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value as Record<string, unknown>);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        return Object.values(error.constraints || {}).join(', ');
      });
      throw new BadRequestException(
        `입력 데이터 검증 실패: ${messages.join('; ')}`,
      );
    }

    return object;
  }

  private toValidate(metatype: Constructor): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as any);
  }
}
