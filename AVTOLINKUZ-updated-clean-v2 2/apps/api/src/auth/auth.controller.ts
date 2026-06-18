import { Body, Controller, Post } from "@nestjs/common";
import { IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { AuthService } from "./auth.service";

class PhoneLoginDto {
  @IsPhoneNumber()
  phone!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class PhoneVerifyDto extends PhoneLoginDto {
  @IsString()
  code!: string;
}

class TelegramLoginDto {
  @IsString()
  telegramId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("phone")
  loginWithPhone(@Body() dto: PhoneLoginDto) {
    return this.authService.loginWithPhone(dto);
  }

  @Post("phone/request")
  requestPhoneOtp(@Body() dto: PhoneLoginDto) {
    return this.authService.requestPhoneOtp(dto);
  }

  @Post("phone/verify")
  verifyPhoneOtp(@Body() dto: PhoneVerifyDto) {
    return this.authService.verifyPhoneOtp(dto);
  }

  @Post("telegram")
  loginWithTelegram(@Body() dto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(dto);
  }
}
