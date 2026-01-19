import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Public } from './jwt-auth.guard';

class LoginDto {
  email: string;
  password: string;
}

class ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

class CreateAdminDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * Admin girişi
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      return {
        success: false,
        message: 'Email veya şifre hatalı',
      };
    }

    return this.authService.login(user, ip);
  }

  /**
   * GET /auth/profile
   * Mevcut kullanıcı bilgileri
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return {
      success: true,
      user: req.user,
    };
  }

  /**
   * POST /auth/change-password
   * Şifre değiştir
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto.oldPassword, dto.newPassword);
  }

  /**
   * GET /auth/admins
   * Admin listesi (sadece superadmin)
   */
  @UseGuards(JwtAuthGuard)
  @Get('admins')
  async getAdmins(@Request() req: any) {
    if (req.user.role !== 'superadmin') {
      return { success: false, message: 'Yetkiniz yok' };
    }
    const admins = await this.authService.getAdminUsers();
    return { success: true, data: admins };
  }

  /**
   * POST /auth/admins
   * Yeni admin oluştur (sadece superadmin)
   */
  @UseGuards(JwtAuthGuard)
  @Post('admins')
  async createAdmin(@Request() req: any, @Body() dto: CreateAdminDto) {
    if (req.user.role !== 'superadmin') {
      return { success: false, message: 'Yetkiniz yok' };
    }
    
    try {
      const admin = await this.authService.createAdminUser(
        dto.email,
        dto.password,
        dto.name,
        dto.role || 'admin',
      );
      return { success: true, data: admin };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * POST /auth/verify
   * Token doğrula
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body('token') token: string) {
    try {
      const payload = await this.authService.validateToken(token);
      return { success: true, valid: true, payload };
    } catch {
      return { success: false, valid: false };
    }
  }
}
