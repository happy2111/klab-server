import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('SELLER')
  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') sellerId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // handle multipart coercion for numeric/boolean fields coming as strings
    const anyDto = createProductDto as any;
    if (anyDto && typeof anyDto.price === 'string') {
      anyDto.price = Number(anyDto.price);
    }
    if (anyDto && typeof anyDto.stock === 'string' && anyDto.stock !== '') {
      anyDto.stock = Number(anyDto.stock);
    }
    if (anyDto && typeof anyDto.isActive === 'string') {
      anyDto.isActive = anyDto.isActive === 'true' || anyDto.isActive === '1';
    }

    if (file) {
      // Store relative path so it can be served statically if configured
      createProductDto.photo = `upload/${file.filename}`;
    }
    return this.productService.create(createProductDto, sellerId);
  }

  @Get()
  findAll(@Query() filter: FilterProductDto) {
    return this.productService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('SELLER')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') sellerId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (updateProductDto && typeof (updateProductDto as any).price === 'string') {
      (updateProductDto as any).price = Number((updateProductDto as any).price);
    }
    if (file) {
      updateProductDto.photo = `upload/${file.filename}`;
    }
    return this.productService.update(id, updateProductDto, sellerId);
  }

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('SELLER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') sellerId: string) {
    return this.productService.remove(id, sellerId);
  }
}
