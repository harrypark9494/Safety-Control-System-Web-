import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UpdateWeatherStationRequest, UpdateWeatherThresholdsRequest } from './weather.dto';
import { WeatherService } from './weather.service';

@Controller('admin/weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get()
  getAdminOverview(@Query('projectId') projectId?: string) {
    return this.weather.getAdminOverview(projectId);
  }

  @Post('station')
  updateStation(@Body() request: UpdateWeatherStationRequest) {
    return this.weather.updateStation(request);
  }

  @Post('thresholds')
  updateThresholds(@Body() request: UpdateWeatherThresholdsRequest) {
    return this.weather.updateThresholds(request);
  }
}
