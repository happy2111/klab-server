import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private normalizeId(id: string): string {
    // Trim and drop any non-hex/dash chars to avoid hidden characters from multipart
    // Keep original casing to avoid mismatches if IDs are stored case-sensitive
    return (id ?? '')
      .trim()
      .replace(/[^a-fA-F0-9-]/g, '');
  }

  async create(dto: CreateProductDto, sellerId: string) {
    const categoryId = this.normalizeId(dto.categoryId);
    const categoryExists = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) throw new NotFoundException('Category not found');

    return this.prisma.product.create({
      data: {
        ...dto,
        categoryId,
        sellerId,
        price: Number(dto.price),
        stock: dto.stock ? Number(dto.stock) : 0,
        isActive: dto.isActive ?? true,
      },
    });
  }


  async findAll(filter: FilterProductDto) {
    const { page = 1, limit = 10, categoryId, createdFrom, createdTo, search } = filter;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    if (search && search.trim() !== '') {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

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

    const data: any = { ...dto };

    if (dto.categoryId) {
      const normalized = this.normalizeId(dto.categoryId);
      const category = await this.prisma.category.findUnique({ where: { id: normalized } });
      if (!category) throw new NotFoundException('Category not found');
      data.categoryId = normalized;
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    return this.prisma.product.delete({ where: { id } });
  }
}
