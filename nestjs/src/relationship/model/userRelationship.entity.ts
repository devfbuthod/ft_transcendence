import { User } from 'src/user/model/user.entity';
import { Relationship } from './relationship.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('userRelationship')
class UserRelationship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  relationshipId!: number;

  @ManyToOne(() => User, (user) => user.userRelationship)
  user!: User;

  @ManyToOne(
    () => Relationship,
    (relationship) => relationship.userRelationship,
    {
      onDelete: 'CASCADE',
    },
  )
  relationship!: Relationship;
}

export default UserRelationship;
