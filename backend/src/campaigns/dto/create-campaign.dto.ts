export class CreateCampaignDto {
  code?: string;
  name: string;
  description?: string;
  type?: string;
  discountType: string;
  discountValue: number;
  discountCurrency?: string;
  discountTarget?: string;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  stackable?: boolean;
  priority?: number;
  usageLimit?: number;
  usagePerUser?: number;
  refundable?: boolean;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
}