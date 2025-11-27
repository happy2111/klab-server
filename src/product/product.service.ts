import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto, sellerId: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        sellerId,
      },
    });
  }

  async findAll(filter: FilterProductDto) {
    const { page = 1, limit = 10, categoryId, createdFrom, createdTo } = filter;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (createdFrom || createdTo) where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) where.createdAt.lte = new Date(createdTo);

    const products = await this.prisma.product.findMany({
      where,
      include: { category: true, seller: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.product.count({ where });

    return {
      data: products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    return this.prisma.product.delete({ where: { id } });
  }
}
