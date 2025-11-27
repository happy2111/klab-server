import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {JwtRefreshGuard} from "../auth/guards/jwt-refresh.guard";

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('SELLER')
  @Post()
  create(@Body() createProductDto: CreateProductDto, @CurrentUser('id') sellerId: string) {
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
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @CurrentUser('id') sellerId: string) {
    return this.productService.update(id, updateProductDto, sellerId);
  }

  @UseGuards(JwtRefreshGuard, RolesGuard)
  @Roles('SELLER')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') sellerId: string) {
    return this.productService.remove(id, sellerId);
  }
}
