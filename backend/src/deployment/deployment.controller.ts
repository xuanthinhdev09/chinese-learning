import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('deployment')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post('deploy')
  @HttpCode(HttpStatus.OK)
  @Public()
  async deploy(
    @Body() body: { secret?: string; services?: ('backend' | 'frontend')[] }
  ) {
    // Verify secret (set via env var)
    const deploySecret = process.env.DEPLOY_SECRET;
    if (deploySecret && body.secret !== deploySecret) {
      throw new UnauthorizedException('Invalid deployment secret');
    }

    const services = body.services || ['backend', 'frontend'];
    return this.deploymentService.deploy(services);
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  @Public()
  async status(@Body() body: { secret?: string }) {
    const deploySecret = process.env.DEPLOY_SECRET;
    if (deploySecret && body.secret !== deploySecret) {
      throw new UnauthorizedException('Invalid deployment secret');
    }

    return this.deploymentService.getStatus();
  }
}
