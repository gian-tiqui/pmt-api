import { Body, Controller, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import { Login, Logout, Refresh, Register } from 'src/types/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RateLimit({
    keyPrefix: 'register',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before registering again.',
  })
  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<Register> {
    return this.authService.register(registerDto);
  }

  @RateLimit({
    keyPrefix: 'login',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before logging in again.',
  })
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<Login> {
    return this.authService.login(loginDto);
  }

  @RateLimit({
    keyPrefix: 'refresh-token',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before refreshing your token.',
  })
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<Refresh> {
    return this.authService.refresh(refreshTokenDto);
  }

  @RateLimit({
    keyPrefix: 'logout',
    points: 10,
    duration: 60,
    errorMessage: 'Please wait before logging out again.',
  })
  @Post('logout')
  logout(@Query('userId', ParseIntPipe) userId: number): Promise<Logout> {
    return this.authService.logout(userId);
  }
}
