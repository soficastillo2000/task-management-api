import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
