import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DeploymentService {
  async deploy(services: ('backend' | 'frontend')[]) {
    const results = [];

    // Pull latest code
    try {
      const { stdout: pullOutput } = await execAsync(
        'cd ~/projects/chinese-learning && git pull origin main'
      );
      results.push({ step: 'pull', success: true, output: pullOutput });
    } catch (error) {
      results.push({ step: 'pull', success: false, error: error.message });
      return { success: false, results };
    }

    // Deploy backend
    if (services.includes('backend')) {
      try {
        const { stdout: buildOutput } = await execAsync(
          'docker compose -f docker/docker-compose.prod.yml build --no-cache backend'
        );
        results.push({ step: 'backend-build', success: true, output: buildOutput });

        const { stdout: restartOutput } = await execAsync(
          'docker compose -f docker/docker-compose.prod.yml up -d backend'
        );
        results.push({ step: 'backend-restart', success: true, output: restartOutput });
      } catch (error) {
        results.push({ step: 'backend', success: false, error: error.message });
      }
    }

    // Deploy frontend
    if (services.includes('frontend')) {
      try {
        const { stdout: buildOutput } = await execAsync(
          'docker compose -f docker/docker-compose.prod.yml build --no-cache nginx'
        );
        results.push({ step: 'frontend-build', success: true, output: buildOutput });

        const { stdout: restartOutput } = await execAsync(
          'docker compose -f docker/docker-compose.prod.yml up -d nginx'
        );
        results.push({ step: 'frontend-restart', success: true, output: restartOutput });
      } catch (error) {
        results.push({ step: 'frontend', success: false, error: error.message });
      }
    }

    const allSuccess = results.every((r) => r.success !== false);
    return { success: allSuccess, results };
  }

  async getStatus() {
    try {
      const { stdout } = await execAsync(
        'docker compose -f docker/docker-compose.prod.yml ps'
      );
      return { success: true, services: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
