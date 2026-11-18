import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    return task;
  }

  async create(data: CreateTaskDto): Promise<Task> {
    const status = data.status ?? TaskStatus.TODO;

    const task = this.tasksRepository.create({
      title: data.title,
      status,
      priority: data.priority ?? TaskPriority.MEDIUM,
      completed: status === TaskStatus.DONE,
    });

    return this.tasksRepository.save(task);
  }

  async update(id: number, changes: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (changes.title !== undefined) {
      task.title = changes.title;
    }

    if (changes.priority !== undefined) {
      task.priority = changes.priority;
    }

    if (changes.status !== undefined) {
      task.status = changes.status;
      task.completed = changes.status === TaskStatus.DONE;
    } else if (changes.completed !== undefined) {
      task.completed = changes.completed;
      task.status = changes.completed
        ? TaskStatus.DONE
        : TaskStatus.TODO;
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
