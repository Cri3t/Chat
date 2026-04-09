import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsString, Length, Min } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 64)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  nickname!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 32)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  confirmPassword!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  gender!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userType!: number;
}
