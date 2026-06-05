import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UpdateWeatherStationRequest, UpdateWeatherThresholdsRequest } from './weather.dto';
import { WeatherService } from './weather.service';

@Controller()
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get('admin/projects/:projectId/weather')
  getAdminProjectOverview(@Param('projectId') projectId: string) {
    return this.weather.getAdminOverview(projectId);
  }

  @Get('admin/weather')
  getAdminOverview(@Query('projectId') projectId?: string) {
    return this.weather.getAdminOverview(projectId);
  }

  @Post('admin/projects/:projectId/weather/station')
  updateProjectStation(
    @Param('projectId') projectId: string,
    @Body() request: UpdateWeatherStationRequest,
  ) {
    return this.weather.updateStation({ ...request, projectId });
  }

  @Post('admin/weather/station')
  updateStation(@Body() request: UpdateWeatherStationRequest) {
    return this.weather.updateStation(request);
  }

  @Post('admin/projects/:projectId/weather/thresholds')
  updateProjectThresholds(
    @Param('projectId') projectId: string,
    @Body() request: UpdateWeatherThresholdsRequest,
  ) {
    return this.weather.updateThresholds({ ...request, projectId });
  }

  @Post('admin/weather/thresholds')
  updateThresholds(@Body() request: UpdateWeatherThresholdsRequest) {
    return this.weather.updateThresholds(request);
  }
}
