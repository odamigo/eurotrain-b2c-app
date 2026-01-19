import { Controller, Get } from '@nestjs/common';

@Controller('trains')
export class TrainsController {
  @Get()
  getAllTrains() {
    return {
      message: 'Tren listesi',
      trains: [
        { id: 1, from: 'Istanbul', to: 'Ankara', price: 150 },
        { id: 2, from: 'Ankara', to: 'Izmir', price: 200 }
      ]
    };
  }
}