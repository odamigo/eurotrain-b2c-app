import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from './entities/campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
  ) {}

  create(createCampaignDto: CreateCampaignDto) {
    const campaign = this.campaignsRepository.create(createCampaignDto);
    return this.campaignsRepository.save(campaign);
  }

  findAll() {
    return this.campaignsRepository.find();
  }

  findOne(id: number) {
    return this.campaignsRepository.findOne({ where: { id } });
  }

  async findByCode(code: string) {
    const campaign = await this.campaignsRepository.findOne({ 
      where: { code, active: true } 
    });
    
    if (!campaign) {
      throw new NotFoundException('Kampanya kodu bulunamadı');
    }

    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
      throw new NotFoundException('Kampanya henüz başlamadı');
    }
    if (campaign.endDate && campaign.endDate < now) {
      throw new NotFoundException('Kampanya süresi doldu');
    }

    if (campaign.usageLimit && campaign.currentUsageCount >= campaign.usageLimit) {
      throw new NotFoundException('Kampanya kullanım limiti doldu');
    }

    return campaign;
  }

  calculateDiscount(campaign: Campaign, basePrice: number, serviceFee: number) {
    let targetAmount = 0;

    switch (campaign.discountTarget) {
      case 'BASE_PRICE':
        targetAmount = basePrice;
        break;
      case 'SERVICE_FEE':
        targetAmount = serviceFee;
        break;
      case 'TOTAL':
        targetAmount = basePrice + serviceFee;
        break;
    }

    let discount = 0;

    if (campaign.discountType === 'PERCENTAGE') {
      discount = targetAmount * (campaign.discountValue / 100);
    } else if (campaign.discountType === 'FIXED') {
      discount = campaign.discountValue;
    }

    if (campaign.maxDiscountAmount && discount > campaign.maxDiscountAmount) {
      discount = campaign.maxDiscountAmount;
    }

    return Math.round(discount * 100) / 100;
  }

  async incrementUsage(id: number) {
    await this.campaignsRepository.increment({ id }, 'currentUsageCount', 1);
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto) {
    await this.campaignsRepository.update(id, updateCampaignDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.campaignsRepository.delete(id);
    return { deleted: true };
  }
}