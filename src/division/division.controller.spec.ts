import { Test, TestingModule } from '@nestjs/testing';
import { DivisionController } from './division.controller';
import { DivisionService } from './division.service';

describe('DivisionController', () => {
  let controller: DivisionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DivisionController],
      providers: [DivisionService],
    }).compile();

    controller = module.get<DivisionController>(DivisionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
