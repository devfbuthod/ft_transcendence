import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/service/user.service';
import { Repository } from 'typeorm';
import { RelationshipDto } from '../dto/relationship.dto';
import { Relationship, RelationshipStatus } from '../model/relationship.entity';
import { SendAddFriendRelationshipDto } from '../dto/send-addFriend-relationship.dto';
import { SendSpecificListRelationshipDto } from '../dto/send-specificList-relationship.dto';
import { SendRelationshipDto } from '../dto/send-relationship.dto';
import UserRelationship from '../model/userRelationship.entity';
import { SendAllUsersRelationshipDto } from '../dto/send-allUsers-relationship.dto';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
    @InjectRepository(UserRelationship)
    private userRelationship: Repository<UserRelationship>,
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  /*  Query ?status="friend/notconfirmed/block"*/
  async getSpecificRelationList(
    id: number,
    reqStatus: string,
  ): Promise<SendSpecificListRelationshipDto[]> {
    const status: RelationshipStatus = this.checkReqStatus(reqStatus);
    const allList = await this.getAllRelationshipWithStatus(status);
    const userList = allList
      .filter((data) => {
        if (
          data.userRelationship[0].userId === id ||
          data.userRelationship[1].userId === id
        )
          return true;
        else return false;
      })
      .filter((data) => {
        if (status === RelationshipStatus.NOTCONFIRMED) {
          if (data.userRelationship[0].id < data.userRelationship[1].id)
            if (data.userRelationship[0].userId === id) return false;
          if (data.userRelationship[0].id > data.userRelationship[1].id)
            if (data.userRelationship[1].userId === id) return false;
        }
        if (status === RelationshipStatus.BLOCK) {
          if (data.userRelationship[0].id < data.userRelationship[1].id)
            if (data.userRelationship[1].userId === id) return false;
          if (data.userRelationship[0].id > data.userRelationship[1].id)
            if (data.userRelationship[0].userId === id) return false;
        }
        return true;
      })
      .map((data) => {
        const res = data.userRelationship.filter((obj) => obj.userId !== id);
        return res[0];
      });
    return this.reformListSendingData(userList);
  }

  /*get user's relationship with other users */
  async getAllRelationList(id: number): Promise<SendAllUsersRelationshipDto[]> {
    const [users, friendIds, notconfirmeIds, blockIds, blockingIds] =
      await Promise.all([
        this.userService.getAllWithConditions(id),
        this.getUserIdsWithStatus(id, RelationshipStatus.FRIEND),
        this.getUserIdsWithStatus(id, RelationshipStatus.NOTCONFIRMED),
        this.getUserIdsWithStatus(id, RelationshipStatus.BLOCK),
        this.getBlockingIds(id),
      ]);
    const relations = users
      .map((data) => ({ ...data, relationship: null }))
      .map((data) => {
        if (friendIds.includes(data.id))
          data.relationship = RelationshipStatus.FRIEND;
        else if (notconfirmeIds.includes(data.id))
          data.relationship = RelationshipStatus.NOTCONFIRMED;
        return data;
      })
      .filter((data) => (blockIds.includes(data.id) ? false : true))
      .filter((data) => (blockingIds.includes(data.id) ? false : true));
    return this.reformAllRelationListSendingData(relations);
  }

  async addFriend(
    id: number,
    relationshipDto: RelationshipDto,
  ): Promise<SendAddFriendRelationshipDto> {
    this.checkIsNotSameUser(id, relationshipDto.addresseeUserId);
    await this.checkUsersRelation(id, relationshipDto.addresseeUserId);
    /*create new relationship*/
    const newRelationship = await this.setNewRelationship(
      RelationshipStatus.NOTCONFIRMED,
    );

    /* add two users in UserRelationship */
    await this.setNewUserRelationship(id, newRelationship.id);
    await this.setNewUserRelationship(
      relationshipDto.addresseeUserId,
      newRelationship.id,
    );

    const relationship = await this.relationshipRepository.findOne({
      where: { id: newRelationship.id },
      relations: ['userRelationship'],
    });
    return this.reformAddFriendSendingData(relationship);
  }

  async acceptFriend(
    relationshipId: number,
    currentUserId: number,
  ): Promise<SendRelationshipDto> {
    const relationship = await this.getOneById(relationshipId);
    this.checkFriendshipStatus(relationship);
    this.checkUserIsAddressee(relationship, currentUserId);
    relationship.status = RelationshipStatus.FRIEND;
    await this.relationshipRepository.save(relationship);

    return this.reformSendingData(relationship);
  }

  async rejectFriend(
    relationshipId: number,
    currentUserId: number,
  ): Promise<SendRelationshipDto> {
    const relationship = await this.getOneById(relationshipId);
    this.checkFriendshipStatus(relationship);
    this.checkUserIsAddressee(relationship, currentUserId);
    await this.relationshipRepository.remove(relationship);
    return this.reformSendingData(relationship);
  }

  async deleteFriend(
    id: number,
    delDto: RelationshipDto,
  ): Promise<SendRelationshipDto> {
    this.checkIsNotSameUser(id, delDto.addresseeUserId);
    const relationId = await this.findUserRelationshipId(
      id,
      delDto.addresseeUserId,
      RelationshipStatus.FRIEND,
    );
    if (!relationId) {
      throw new HttpException(
        'Users are not friends, cannot unfriend.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const delRelationship = await this.getOneById(relationId);
    await this.relationshipRepository.remove(delRelationship);
    return this.reformSendingData(delRelationship);
  }

  async blockUser(id: number, dto: RelationshipDto): Promise<Relationship> {
    this.checkIsNotSameUser(id, dto.addresseeUserId);
    await this.checkUsersAreNotBlock(id, dto.addresseeUserId);
    await this.deleteCurrentRelationship(id, dto.addresseeUserId);
    const blockRelationship = await this.setNewRelationship(
      RelationshipStatus.BLOCK,
    );
    /* add two users in UserRelationship */
    await this.setNewUserRelationship(id, blockRelationship.id);
    await this.setNewUserRelationship(
      dto.addresseeUserId,
      blockRelationship.id,
    );
    return blockRelationship;
  }

  async deleteBlockUser(
    id: number,
    delDto: RelationshipDto,
  ): Promise<SendRelationshipDto> {
    this.checkIsNotSameUser(id, delDto.addresseeUserId);
    const relationId = await this.findUserRelationshipId(
      id,
      delDto.addresseeUserId,
      RelationshipStatus.BLOCK,
    );
    if (!relationId) {
      throw new HttpException(
        'User is not on blocklist, cannot unblock.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const delRelationship = await this.getOneById(relationId);
    await this.relationshipRepository.remove(delRelationship);
    return this.reformSendingData(delRelationship);
  }

  /****************************************************************************/
  /*                                 utils                                    */
  /****************************************************************************/

  /**
   * getAllRelationshipWithStatus
   * @param : status
   * @returns : specific status' relationship with two related users
   */
  getAllRelationshipWithStatus(
    status: RelationshipStatus,
  ): Promise<Relationship[]> {
    return this.relationshipRepository.find({
      relations: ['userRelationship', 'userRelationship.user'],
      where: { status: status },
    });
  }

  /**
   * getOneById
   * @param : relationship id
   * @returns : that demanded relationship with two related users
   */
  getOneById(id: number): Promise<Relationship> {
    return this.relationshipRepository.findOne(id, {
      relations: ['userRelationship'],
    });
  }

  /**
   * getFullData
   * @param : userId and the relationship's status
   * @returns : user's related other users
   */
  getFullData(id: number, status: string): Promise<UserRelationship[]> {
    return this.userRelationship.find({
      where: {
        userId: id,
        relationship: { status: status },
      },
      relations: ['relationship', 'relationship.userRelationship'],
    });
  }

  /**
   * findUserRelationshipId
   * @param : userId, friendId, the relationship's status
   * @returns : user and his friend's linked relationshipId
   */
  async findUserRelationshipId(
    userOne: number,
    userTwo: number,
    status: RelationshipStatus,
  ): Promise<number> {
    const data = await this.getFullData(userOne, status);
    const found = data
      .map((obj) => {
        const relation = obj.relationship.userRelationship
          .filter((obj) => obj.userId === userTwo)
          .map((obj) => obj.relationshipId);
        return relation;
      })
      .filter((obj) => obj.length !== 0);
    if (found.length === 0) {
      return 0;
    }
    const relationshipId = found[0][0];
    return relationshipId;
  }

  /**
   * setNewRelationship save new Relationship
   * @param : relationship status
   * @returns : Relationship
   */
  setNewRelationship(status: RelationshipStatus): Promise<Relationship> {
    const newRelationship = this.relationshipRepository.create();
    newRelationship.status = status;
    return this.relationshipRepository.save(newRelationship);
  }

  /**
   * setNewUserRelationship save user in userRelationship table
   * @param : user id
   * @returns : userRelationship
   */
  setNewUserRelationship(
    id: number,
    relationshipId: number,
  ): Promise<UserRelationship> {
    const userRelationship = this.userRelationship.create();
    userRelationship.userId = id;
    userRelationship.relationshipId = relationshipId;
    return this.userRelationship.save(userRelationship);
  }

  /**
   * getUserIdsWithStatus
   * @param : userId and the status demanded
   * @returns : array [user ids]
   */
  async getUserIdsWithStatus(
    id: number,
    reqStatus: RelationshipStatus,
  ): Promise<number[]> {
    const data = await this.getFullData(id, reqStatus);
    if (
      reqStatus == RelationshipStatus.FRIEND ||
      reqStatus == RelationshipStatus.NOTCONFIRMED
    ) {
      const list = data.map((obj) => {
        const relation = obj.relationship.userRelationship.filter(
          (obj) => obj.userId !== id,
        );
        return relation[0].userId;
      });
      return list;
    } else {
      const blockList = data
        .map((obj) => {
          if (
            obj.relationship.userRelationship[0].id <
            obj.relationship.userRelationship[1].id
          )
            return obj.relationship.userRelationship[1].userId;
          else return obj.relationship.userRelationship[0].userId;
        })
        .filter((data) => data !== id);
      return blockList;
    }
  }

  /**
   * getBlockingIds
   * @param : userId
   * @returns : array [other user ids who block @param id]
   */
  async getBlockingIds(id: number): Promise<number[]> {
    const data = await this.getFullData(id, RelationshipStatus.BLOCK);
    const blockingList = data
      .map((obj) => {
        if (
          obj.relationship.userRelationship[0].id <
          obj.relationship.userRelationship[1].id
        )
          return obj.relationship.userRelationship[0].userId;
        else return obj.relationship.userRelationship[1].userId;
      })
      .filter((data) => data !== id);
    return blockingList;
  }

  async deleteCurrentRelationship(
    userOne: number,
    userTwo: number,
  ): Promise<Relationship> {
    const [friendRelationId, notconfirmRelationId] = await Promise.all([
      this.findUserRelationshipId(userOne, userTwo, RelationshipStatus.FRIEND),
      this.findUserRelationshipId(
        userOne,
        userTwo,
        RelationshipStatus.NOTCONFIRMED,
      ),
    ]);
    if (friendRelationId) {
      const delRelationship = await this.getOneById(friendRelationId);
      return this.relationshipRepository.remove(delRelationship);
    } else if (notconfirmRelationId) {
      const delRelationship = await this.getOneById(notconfirmRelationId);
      return this.relationshipRepository.remove(delRelationship);
    }
  }

  /****************************************************************************/
  /*                                 checkers                                 */
  /****************************************************************************/

  /**
   * @param : relationship and currentUserId
   */
  checkUserIsAddressee(relationship: Relationship, userId: number): void {
    if (
      (relationship.userRelationship[0].id <
        relationship.userRelationship[1].id &&
        relationship.userRelationship[0].userId === userId) ||
      (relationship.userRelationship[0].id >
        relationship.userRelationship[1].id &&
        relationship.userRelationship[1].userId === userId)
    ) {
      throw new HttpException(
        'Current User is the one who made the friend request, he/she cannot accept this relationship.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * checkFriendshipStatus throws exception if relationship does not exist,
   * or it has already the status Friend/Block
   */
  checkFriendshipStatus(relationship: Relationship): void {
    if (!relationship) {
      throw new HttpException(
        'Relationship with this id does not exist.',
        HttpStatus.NOT_FOUND,
      );
    }
    if (relationship.status !== RelationshipStatus.NOTCONFIRMED) {
      throw new HttpException(
        'Relationship has been confirmed already, cannot modify again.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /*
   * checkIsNotSameUser throws exception if user does not exist,
   * or userOne and UserTwo have same id
   */
  checkIsNotSameUser(userOne: number, userTwo: number): void {
    if (userOne === userTwo) {
      throw new HttpException(
        'User cannot add, unfriend, block, unblock her / himself !',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * checkUsersRelation see if there's an existing relationship between users,
   * throws exception if it's true
   */
  async checkUsersRelation(userOne: number, userTwo: number): Promise<void> {
    const friend = await this.findUserRelationshipId(
      userOne,
      userTwo,
      RelationshipStatus.FRIEND,
    );
    if (friend > 0) {
      throw new HttpException(
        'Users are friends already.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const [unconfirm, block] = await Promise.all([
      this.findUserRelationshipId(
        userOne,
        userTwo,
        RelationshipStatus.NOTCONFIRMED,
      ),
      this.findUserRelationshipId(userOne, userTwo, RelationshipStatus.BLOCK),
    ]);
    if (unconfirm > 0 || block > 0) {
      throw new HttpException(
        'Users had an existing relationship, it should be unconfirm or block.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async checkUsersAreNotBlock(userOne: number, userTwo: number): Promise<void> {
    const block = await this.findUserRelationshipId(
      userOne,
      userTwo,
      RelationshipStatus.BLOCK,
    );
    if (block) {
      throw new HttpException(
        'Users are in a block relationship, cannot block again.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  checkReqStatus(reqStatus: string): RelationshipStatus {
    let status: RelationshipStatus;
    if (reqStatus === 'friend') status = RelationshipStatus.FRIEND;
    else if (reqStatus === 'notconfirmed')
      status = RelationshipStatus.NOTCONFIRMED;
    else if (reqStatus === 'block') status = RelationshipStatus.BLOCK;
    else {
      throw new HttpException(
        'Relationship status does not exist.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return status;
  }

  /****************************************************************************/
  /*                              Reform Objs                                 */
  /****************************************************************************/

  /**
   * reformSendingData returns SendRelationshipDto[]
   */
  reformSendingData(relationship: Relationship): SendRelationshipDto {
    const obj: SendRelationshipDto = {
      id: relationship.id,
      createDate: relationship.createDate,
      status: relationship.status,
      users: [
        relationship.userRelationship[0].userId,
        relationship.userRelationship[1].userId,
      ],
    };
    return obj;
  }

  /**
   * reformAddFriendSendingData returns
   */
  reformAddFriendSendingData(
    relationship: Relationship,
  ): SendAddFriendRelationshipDto {
    const obj: SendAddFriendRelationshipDto = {
      relationshipId: relationship.id,
      createDate: relationship.createDate,
      status: relationship.status,
      demanderId: relationship.userRelationship[0].userId,
      addresseeId: relationship.userRelationship[1].userId,
    };
    return obj;
  }

  reformListSendingData(
    userList: UserRelationship[],
  ): SendSpecificListRelationshipDto[] {
    const ret: SendSpecificListRelationshipDto[] = userList.map((data) => {
      const obj: SendSpecificListRelationshipDto = {
        user_id: data.user.id,
        user_nickname: data.user.nickname,
        user_avatar: data.user.avatar,
        user_userStatus: data.user.userStatus,
        user_siteStatus: data.user.siteStatus,
        relation_id: data.relationshipId,
      };
      return obj;
    });
    return ret;
  }

  reformAllRelationListSendingData(list: any): SendAllUsersRelationshipDto[] {
    const ret: SendAllUsersRelationshipDto[] = list.map((data) => {
      const obj: SendAllUsersRelationshipDto = {
        id: data.id,
        nickname: data.nickname,
        avatar: data.avatar,
        userStatus: data.userStatus,
        relationship: data.relationship,
      };
      return obj;
    });
    return ret;
  }
}
