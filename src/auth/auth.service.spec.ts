import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as argon from 'argon2';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto = {
        departmentId: 1,
        divisionId: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        middleName: 'T',
        employeeId: 1010,
      };

      jest.spyOn(argon, 'hash').mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...registerDto,
          password: 'hashed_password',
        },
      });
      expect(result).toEqual({
        message: 'User registered successfully.',
      });
    });

    it('should handle registration errors', async () => {
      jest.spyOn(argon, 'hash').mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockRejectedValue(new Error('Test error'));

      await expect(
        service.register({
          departmentId: 1,
          divisionId: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
          middleName: 'T',
          employeeId: 1010,
        }),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    // it('should login a user successfully', async () => {
    //   const loginDto = { employeeId: 1, password: 'password123' };
    //   const mockUser = {
    //     id: 1,
    //     firstName: 'Test',
    //     lastName: 'User',
    //     email: 'test@example.com',
    //     password: 'hashed_password',
    //     refreshToken: 'old_refresh_token',
    //     department: { id: 1, description: 'Dept', code: 'DPT' },
    //   };

    //   jest.spyOn(argon, 'verify').mockResolvedValue(true);
    //   mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    //   mockJwtService.signAsync.mockResolvedValue('access_token');
    //   mockPrismaService.user.update.mockResolvedValue(mockUser);

    //   const result = await service.login(loginDto);

    //   expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
    //     where: { employeeId: loginDto.employeeId },
    //     include: { department: true },
    //   });
    //   expect(mockPrismaService.user.update).toHaveBeenCalledWith({
    //     where: { id: mockUser.id },
    //     data: { refreshToken: 'access_token' },
    //   });
    //   expect(result).toEqual({
    //     message: 'User tokens loaded successfully.',
    //     tokens: { accessToken: 'access_token', refreshToken: 'access_token' },
    //   });
    // });

    it('should throw an error if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ employeeId: 1010, password: 'password123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if password does not match', async () => {
      const mockUser = {
        password: 'hashed_password',
      };

      jest.spyOn(argon, 'verify').mockResolvedValue(false);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ employeeId: 1010, password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('should refresh an access token', async () => {
      const refreshTokenDto = { refreshToken: 'refresh_token' };
      const mockUser = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        department: { id: 1, description: 'Dept', code: 'DPT' },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('new_access_token');

      const result = await service.refresh(refreshTokenDto);

      expect(result).toEqual({
        message: 'Access token regenerated successfully.',
        accessToken: 'new_access_token',
      });
    });

    it('should throw an error if refresh token is not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid_token' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should log out a user', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.logout(1);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: null },
      });
      expect(result).toEqual({
        message: 'Logged out successfully.',
      });
    });

    it('should handle logout errors', async () => {
      mockPrismaService.user.update.mockRejectedValue(new Error('Test error'));

      await expect(service.logout(1010)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
