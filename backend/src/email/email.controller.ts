import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async sendTestEmail(@Body() body: { email: string }) {
    const result = await this.emailService.sendMagicLink(body.email, 'test-token-123');
    return { success: result, message: result ? 'Email gonderildi' : 'Email gonderilemedi' };
  }
}
