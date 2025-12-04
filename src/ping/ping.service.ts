// ping.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  @Cron('*/10 * * * *') // каждые 10 минут
  async pingServer() {
    try {
      const url = process.env.PING_URL || 'https://klab-server.onrender.com';

      await axios.get(url);

      this.logger.log(`Ping sent to ${url}`);
    } catch (error) {
      this.logger.error('Ping failed:', error.message);
    }
  }
}
