import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MatchesService } from './matches.service';
import { MatchJoinService } from './match-join.service';
import { MatchQueryService } from './match-query.service';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMatchDto, FindMatchesQueryDto } from './dto/match.dto';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchJoinService: MatchJoinService,
    private readonly matchQueryService: MatchQueryService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new match' })
  async create(@Req() req: any, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(req.user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Find matches (nearby or all)' })
  async findAll(@Query() query: FindMatchesQueryDto) {
    if (query.lat != null && query.lng != null) {
      return this.matchQueryService.findNearby(
        query.lat,
        query.lng,
        query.radius,
        { status: query.status, page: query.page, limit: query.limit },
      );
    }
    return this.matchQueryService.findByStatus(
      query.status, query.page, query.limit,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get match details by id' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.findById(id);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a match' })
  async join(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.matchJoinService.join(id, req.user.sub);
  }

  @Post(':id/leave')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a match' })
  async leave(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.matchJoinService.leave(id, req.user.sub);
  }

  @Post(':id/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar asistencia al partido' })
  async confirmAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.attendanceService.confirmAttendance(id, req.user.sub);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a match (creator only, alone)' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.matchesService.delete(id, req.user.sub);
  }
}
