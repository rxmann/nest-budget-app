import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username must not be empty' })
  username: string;

  @IsEmail({}, { message: 'Must be a valid email' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
