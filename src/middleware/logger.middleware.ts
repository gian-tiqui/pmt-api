import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger: Logger = new Logger('LoggerMiddleware');

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Inject the cache instance
  ) {}

  async use(req: any, res: any, next: () => void) {
    try {
      if (this.cacheManager.store.keys) {
        const keys = await this.cacheManager.store.keys(); // Check if keys method exists
        console.log('Cache keys:', keys);
      } else {
        console.log(
          'The keys() method is not supported by the current cache store.',
        );
      }
    } catch (error) {
      this.logger.error('Error accessing cache keys', error);
    }
    next();
  }
}
