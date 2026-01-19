import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
  ) {}

  // Uygulama başladığında varsayılan admin oluştur
  async onModuleInit() {
    const adminExists = await this.adminUserRepository.findOne({
      where: { email: 'admin@eurotrain.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.adminUserRepository.save({
        email: 'admin@eurotrain.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'superadmin',
      });
      console.log('✅ Varsayılan admin oluşturuldu: admin@eurotrain.com / admin123');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.adminUserRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip?: string) {
    // Son login bilgisini güncelle
    await this.adminUserRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip || 'unknown',
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      success: true,
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Geçersiz token');
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Mevcut şifre yanlış');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.adminUserRepository.update(userId, { password: hashedPassword });

    return { success: true, message: 'Şifre değiştirildi' };
  }

  async getAdminUsers() {
    const users = await this.adminUserRepository.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    });
    return users;
  }

  async createAdminUser(email: string, password: string, name: string, role: string = 'admin') {
    const exists = await this.adminUserRepository.findOne({ where: { email } });
    if (exists) {
      throw new Error('Bu email zaten kayıtlı');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.adminUserRepository.save({
      email,
      password: hashedPassword,
      name,
      role,
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
