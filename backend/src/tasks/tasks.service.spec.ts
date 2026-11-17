import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import type { Repository } from 'typeorm';
import type { Task } from './task.entity.js';

function setup() {
  const tasks: Task[] = [];
  let nextId = 1;

  const repository = {
    find: vi.fn(async () => [...tasks]),
    findOneBy: vi.fn(async ({ id }: { id: number }) =>
      tasks.find((task) => task.id === id) ?? null,
    ),
    create: vi.fn((data: Partial<Task>) => data as Task),
    save: vi.fn(async (task: Task) => {
      if (!task.id) {
        task.id = nextId++;
        tasks.push(task);
      }
      return task;
    }),
    remove: vi.fn(async (task: Task) => {
      const index = tasks.findIndex((item) => item.id === task.id);
      if (index >= 0) tasks.splice(index, 1);
      return task;
    }),
  };

  const service = new TasksService(
    repository as unknown as Repository<Task>,
  );

  return { service };
}

describe('TasksService', () => {
  it('creates a task', async () => {
    const { service } = setup();
    const task = await service.create('Write tests');

    expect(task).toMatchObject({
      id: 1,
      title: 'Write tests',
      completed: false,
    });
  });

  it('lists created tasks', async () => {
    const { service } = setup();
    await service.create('First task');

    const tasks = await service.findAll();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('First task');
  });

  it('updates a task', async () => {
    const { service } = setup();
    const task = await service.create('Pending');

    const updated = await service.update(task.id, {
      completed: true,
    });

    expect(updated.completed).toBe(true);
  });

  it('deletes a task', async () => {
    const { service } = setup();
    const task = await service.create('Delete me');

    await service.remove(task.id);

    expect(await service.findAll()).toHaveLength(0);
  });

  it('throws when a task does not exist', async () => {
    const { service } = setup();

    await expect(service.findOne(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
