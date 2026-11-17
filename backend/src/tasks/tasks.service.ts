
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity.js';

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

  async create(title: string): Promise<Task> {
    const task = this.tasksRepository.create({
      title,
      completed: false,
    });

    return this.tasksRepository.save(task);
  }

  async update(
    id: number,
    changes: Partial<Pick<Task, 'title' | 'completed'>>,
  ): Promise<Task> {
    const task = await this.findOne(id);

    if (changes.title !== undefined) {
      task.title = changes.title;
    }

    if (changes.completed !== undefined) {
      task.completed = changes.completed;
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
