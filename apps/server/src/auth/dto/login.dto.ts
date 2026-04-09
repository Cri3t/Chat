import { IsNotEmpty, IsString, Length } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 64)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  password!: string;
}
