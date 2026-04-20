import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoanApplicationModule } from 'src/loan-application/loan-application.module';

@Module({
  imports: [PrismaModule, LoanApplicationModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
