import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  use(req: any, res: any, next: () => void) {
    console.log(this.cacheManager.store.keys());
    next();
  }
}
