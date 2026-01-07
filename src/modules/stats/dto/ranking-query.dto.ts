import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RankingQueryDto {
  @ApiProperty({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수 (최대 50개)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}