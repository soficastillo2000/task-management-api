import { ConfigModule } from '@nestjs/config';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TasksModule } from './tasks/tasks.module.js';
import { Task } from './tasks/task.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: true },
          }
        : {
            host: process.env.DB_HOST ?? 'localhost',
            port: Number(process.env.DB_PORT ?? 5432),
            username: process.env.DB_USERNAME ?? '',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_DATABASE ?? 'task_management',
          }),
      entities: [Task],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
