import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { PricingService } from '../pricing/pricing.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private pricingService: PricingService,
    private campaignsService: CampaignsService,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const basePrice = createBookingDto.price;
    
    // Fiyat hesaplama
    const priceCalculation = this.pricingService.calculateFullPrice(
      basePrice,
      'EUR'
    );
    
    let finalPrice = priceCalculation.total;
    let discount = 0;
    let campaignName: string | null = null;
    
    // Promo code varsa indirim hesapla
    if (createBookingDto.promoCode) {
      try {
        const campaign = await this.campaignsService.findByCode(
          createBookingDto.promoCode
        );
        
        // İndirim hesapla
        discount = this.campaignsService.calculateDiscount(
          campaign,
          basePrice,
          priceCalculation.serviceFee
        );
        
        finalPrice = priceCalculation.total - discount;
        campaignName = campaign.name;
        
        // Kampanya kullanım sayısını artır
        await this.campaignsService.incrementUsage(campaign.id);
      } catch (error) {
        // Geçersiz promo code - hata verme, sadece indirim uygulanmaz
        console.log('Invalid promo code:', error.message);
      }
    }
    
    // Rezervasyon oluştur
    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      price: finalPrice,
      departure_date: createBookingDto.departure_date,
      departure_time: createBookingDto.departure_time,
      arrival_time: createBookingDto.arrival_time,
      train_number: createBookingDto.train_number,
      operator: createBookingDto.operator,
    });
    
    const savedBooking = await this.bookingsRepository.save(booking);
    
    // Detaylı cevap döndür
    return {
      ...savedBooking,
      priceBreakdown: {
        basePrice,
        serviceFee: priceCalculation.serviceFee,
        subtotal: priceCalculation.total,
        discount,
        campaignApplied: campaignName,
        finalPrice,
      },
    };
  }

  findAll() {
    return this.bookingsRepository.find();
  }

  findOne(id: number) {
    return this.bookingsRepository.findOne({ where: { id } });
  }

  findByPnr(pnr: string) {
    return this.bookingsRepository.findOne({ where: { pnr } });
  }

  findByEmail(email: string) {
    return this.bookingsRepository.find({ where: { customerEmail: email } });
  }

  async update(id: number, updateBookingDto: UpdateBookingDto) {
    await this.bookingsRepository.update(id, updateBookingDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.bookingsRepository.delete(id);
    return { deleted: true };
  }
}
