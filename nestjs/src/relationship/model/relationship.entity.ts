import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import UserRelationship from './userRelationship.entity';

export enum RelationshipStatus {
  NOTCONFIRMED = 'Not confirmed',
  FRIEND = 'Friend',
  BLOCK = 'Block',
}

@Entity()
export class Relationship {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createDate: Date;

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
  })
  status: RelationshipStatus;

  @OneToMany(
    () => UserRelationship,
    (userRelationship) => userRelationship.relationship,
    {
      cascade: true,
    },
  )
  public userRelationship!: UserRelationship[];
}
