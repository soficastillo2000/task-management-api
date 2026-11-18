import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseIntPipe, Patch, Post,
} from '@nestjs/common';
import {
  ApiBody, ApiCreatedResponse, ApiNoContentResponse,
  ApiNotFoundResponse, ApiOkResponse, ApiTags,
} from '@nestjs/swagger';

import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './task.entity.js';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOkResponse({ type: Task, isArray: true })
  findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: Task })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiBody({ type: CreateTaskDto })
  @ApiCreatedResponse({ type: Task })
  create(@Body() body: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(body);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateTaskDto })
  @ApiOkResponse({ type: Task })
  @ApiNotFoundResponse({ description: 'Task not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Task deleted successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tasksService.remove(id);
  }
}
