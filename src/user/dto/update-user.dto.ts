import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  readonly name?: string;

  @IsString()
  readonly password?: string;

  @IsNotEmpty()
  readonly id: number;
}
