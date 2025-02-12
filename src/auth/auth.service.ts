import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as argon from 'argon2';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { handleErrors } from '../utils/functions';
import {
  Login,
  Logout,
  Refresh,
  Register,
  SignRefreshToken,
  SignToken,
} from 'src/types/types';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthLogger');

  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Register> {
    const { password, ...registerData } = registerDto;
    try {
      const hashedPassword = await argon.hash(password);

      const newUser = await this.prismaService.user.create({
        data: {
          ...registerData,
          password: hashedPassword,
        },
      });

      if (!newUser)
        throw new NotFoundException(`There was a problem in creating a user.`);

      return {
        message: 'User registered successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async login(loginDto: LoginDto): Promise<Login> {
    const { email, password } = loginDto;

    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
        include: { department: true },
      });

      if (!user) throw new NotFoundException(`Email not found.`);

      const passwordMatch = await argon.verify(user.password, password);

      if (!passwordMatch)
        throw new BadRequestException(`You have entered the wrong password`);

      const accessToken = await this.signToken(
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.department.id,
        user.department.description,
        user.department.code,
      );

      let refreshToken;

      if (user.refreshToken) refreshToken = user.refreshToken;
      else {
        refreshToken = await this.signRefreshToken(user.id);
        await this.prismaService.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        return {
          message: 'User tokens loaded successfully.',
          tokens: { accessToken, refreshToken },
        };
      }

      return {
        message: 'User tokens loaded successfully.',
        tokens: { accessToken, refreshToken },
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<Refresh> {
    const { refreshToken } = refreshTokenDto;

    try {
      if (!refreshToken)
        throw new BadRequestException(`Refresh token is required.`);

      const user = await this.prismaService.user.findFirst({
        where: { refreshToken },
        include: { department: true },
      });

      if (!user) throw new NotFoundException(`Refresh token not found`);

      const accessToken = await this.signToken(
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.department.id,
        user.department.description,
        user.department.code,
      );

      return {
        message: 'Access token regenerated successfully.',
        accessToken,
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  async logout(userId: number): Promise<Logout> {
    try {
      const logout = await this.prismaService.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      if (!logout)
        throw new BadRequestException('There was a problem in logging out.');

      return {
        message: 'Logged out successfully.',
      };
    } catch (error) {
      handleErrors(error, this.logger);
    }
  }

  private async signToken(
    userId: number,
    firstName: string,
    lastName: string,
    email: string,
    departmentId: number,
    description: string,
    code: string,
  ): SignToken {
    return this.jwtService.signAsync({
      sub: userId,
      firstName,
      lastName,
      email,
      departmentId,
      description,
      code,
    });
  }

  private async signRefreshToken(userId: number): SignRefreshToken {
    const refreshTokenSecret = this.configService.get<string>('RT_SECRET');
    const refreshTokenExpiration = this.configService.get<string>('RT_EXP');

    return this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: refreshTokenExpiration, secret: refreshTokenSecret },
    );
  }
}
