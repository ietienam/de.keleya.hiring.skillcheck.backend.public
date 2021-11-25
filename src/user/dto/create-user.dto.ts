import { IsNotEmpty, MinLength, IsEmail, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @IsBoolean()
  readonly admin?: boolean;
  @IsBoolean()
  readonly email_confirmed?: boolean;
}
