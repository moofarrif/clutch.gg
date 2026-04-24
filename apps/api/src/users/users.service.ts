import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByGoogleId(googleId: string) {
    return this.usersRepository.findByGoogleId(googleId);
  }

  async findByAppleId(appleId: string) {
    return this.usersRepository.findByAppleId(appleId);
  }

  async create(data: Parameters<UsersRepository['create']>[0]) {
    return this.usersRepository.create(data);
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const user = await this.usersRepository.update(id, data);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMmr(id: string, mmr: number) {
    const user = await this.usersRepository.updateMmr(id, mmr);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateConductScore(id: string, conductScore: number) {
    const user = await this.usersRepository.updateConductScore(id, conductScore);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
