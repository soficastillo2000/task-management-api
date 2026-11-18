import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'Implement authentication' })
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  @Column({ type: 'varchar', length: 20, default: TaskStatus.TODO })
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;
}
