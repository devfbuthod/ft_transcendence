import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'file' })
class DatabaseFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId!: number;

  @Column()
  filename: string;

  @Column({
    type: 'bytea',
  })
  data: Uint8Array;

  @OneToOne(() => User, (user) => user.avatarFile)
  user: User;
}

export default DatabaseFile;
