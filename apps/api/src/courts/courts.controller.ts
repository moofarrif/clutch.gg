import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CourtsService } from './courts.service';
import { CreateCourtDto, UpdateCourtDto, FindCourtsQueryDto } from './dto/court.dto';

@ApiTags('Courts')
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get()
  @Public()
  findAll(@Query() query: FindCourtsQueryDto) {
    return this.courtsService.findAll(query);
  }

  @Get(':id')
  @Public()
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.courtsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  create(@Body() dto: CreateCourtDto) {
    return this.courtsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.courtsService.deactivate(id);
  }
}
