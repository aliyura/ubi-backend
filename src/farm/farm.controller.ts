import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { FarmService } from './farm.service';
import { CreateFarmDto, UpdateFarmDto } from './dto';
import { FileService } from 'src/file/file.service';
import { farmResponse } from './farm.response';

const farmPhotoMulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@ApiTags('Farms')
@Controller('v1/farms')
export class FarmController {
  constructor(
    private readonly farmService: FarmService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my farms' })
  @ApiResponse({ status: HttpStatus.OK, example: farmResponse.getMyFarms })
  async getMyFarms(@Req() req: Request) {
    return this.farmService.getMyFarms((req as any).user);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farm detail' })
  @ApiResponse({ status: HttpStatus.OK, example: farmResponse.getFarm })
  async getFarm(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.farmService.getFarm(id, (req as any).user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a farm' })
  @ApiResponse({ status: HttpStatus.CREATED, example: farmResponse.createFarm })
  async createFarm(@Body() body: CreateFarmDto, @Req() req: Request) {
    return this.farmService.createFarm(body, (req as any).user);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a farm' })
  @ApiResponse({ status: HttpStatus.OK, example: farmResponse.updateFarm })
  async updateFarm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFarmDto,
    @Req() req: Request,
  ) {
    return this.farmService.updateFarm(id, body, (req as any).user);
  }

  @Post(':id/photos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload farm photo' })
  @ApiResponse({ status: HttpStatus.CREATED, example: farmResponse.addPhoto })
  @UseInterceptors(FileInterceptor('file', farmPhotoMulterOptions))
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const uploaded = await this.fileService.uploadFile(file, { folder: 'farm-photos' });
    return this.farmService.addFarmPhoto(
      id,
      uploaded.data?.url ?? '',
      file.originalname,
      (req as any).user,
    );
  }
}
