import { Controller, Get, Patch, Body, UseGuards, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard'; // Предполагаем, что этот Guard защищает маршруты
@UseGuards(JwtRefreshGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findOne(@CurrentUser('id') userId: string) {
    return this.profileService.findOne(userId);
  }

  @Patch()
  update(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(userId, updateProfileDto);
  }

  @Put('password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(userId, changePasswordDto);
  }
}