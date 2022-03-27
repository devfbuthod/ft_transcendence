import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineStatus, SiteStatus, User } from '../model/user.entity';
import { CreateUserDto } from '../model/create-user.dto';
import { Repository, UpdateResult } from 'typeorm';
import { ChangeUserNameDto } from '../model/change-username.dto';
import {
  OptionSiteStatus,
  SetUserSiteStatusDto,
} from 'src/admin/dto/set-user-site-status.dto';
import DatabaseFile from '../model/databasefile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(DatabaseFile)
    private databaseFilesRepository: Repository<DatabaseFile>,
  ) {}

  /**
   * getAll
   * @returns : all users
   */
  getAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'nickname', 'avatar', 'userStatus', 'siteStatus'],
      order: { createDate: 'ASC' },
    });
  }

  /**
   * getOneById
   * @param : user id
   * @returns : user
   */
  getOneById(id: number): Promise<User> {
    return this.userRepository.findOne(id, {
      select: [
        'id',
        'nickname',
        'avatar',
        'createDate',
        'userStatus',
        'siteStatus',
        'email',
        'isTwoFactorAuthenticationEnabled',
      ],
    });
  }

  /**
   * getUserWithTwoFactor
   * @param : user id
   * @returns : user
   */
  getUserWithTwoFactor(id: number): Promise<User> {
    return this.userRepository.findOne(id);
  }

  /**
   * getUserProfileById
   * @param : user id
   * @returns : user or throw error
   */
  async getUserProfileById(id: number): Promise<User> {
    const user = await this.userRepository.findOne(id, {
      select: ['id', 'nickname', 'avatar', 'createDate', 'userStatus', 'email'],
    });
    if (user) {
      return user;
    }
    throw new HttpException(
      `This user ${id} does not exist.`,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * createUser
   * @param : 42 profile payload
   * @returns : user
   */
  createUser(profile: any): Promise<User> {
    const newUser = this.userRepository.create();
    newUser.id = profile.id;
    newUser.nickname = profile.login;
    newUser.email = profile.email;
    newUser.avatar = profile.image_url;
    newUser.userStatus = OnlineStatus.AVAILABLE;
    if (profile.id === 57882) newUser.siteStatus = SiteStatus.OWNER;
    else newUser.siteStatus = SiteStatus.USER;
    return this.userRepository.save(newUser);
  }

  /*
   ** Test only, delete later
   */
  createUserWithDto(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create({ ...createUserDto });
    newUser.isTwoFactorAuthenticationEnabled = false;
    newUser.userStatus = OnlineStatus.AVAILABLE;
    newUser.siteStatus = SiteStatus.USER;
    return this.userRepository.save(newUser);
  }

  /**
   * changeUserName
   * @param : user id and new nickname
   * @returns : user
   */
  async changeUserName(
    id: number,
    changeUserNameDto: ChangeUserNameDto,
  ): Promise<User> {
    const user = await this.getOneById(id);
    if (!user) {
      throw new HttpException(
        `This User ${id} does not exist !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.nickname === changeUserNameDto.nickname) {
      throw new HttpException(
        `${user.nickname} is your current nickname !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const allUsers = await this.getUserNameList();
    if (allUsers.includes(changeUserNameDto.nickname)) {
      throw new HttpException(
        `${changeUserNameDto.nickname} has been taken, please choose a new one !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    user.nickname = changeUserNameDto.nickname;
    return this.userRepository.save(user);
  }

  /**
   * addAvatar
   * @param : user id and new avatar
   * @returns : user
   */
  async addAvatar(
    id: number,
    imageBuffer: Buffer,
    filename: string,
  ): Promise<User> {
    const user = await this.getOneById(id);
    if (!user) {
      throw new HttpException(
        `This User ${id} does not exist !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const oldDatafile = await this.databaseFilesRepository.findOne({
      where: { userId: id },
    });
    if (oldDatafile) {
      await this.databaseFilesRepository.remove(oldDatafile);
    }
    const findExtension = filename.lastIndexOf('.');
    const originFileName = filename.slice(0, findExtension);
    const newFilename = filename.replace(originFileName, user.nickname);
    const avatar = await this.uploadDatabaseFile(id, imageBuffer, newFilename);
    user.avatar = `http://${process.env.DOMAIN_BACKEND}/profile/avatarfile/${avatar.id}`;
    return this.userRepository.save(user);
  }

  /**
   * setTwoFactorAuthenticationSecret
   * @param : user id and secret
   * @returns : update info
   */
  setTwoFactorAuthenticationSecret(
    secret: string,
    userId: number,
  ): Promise<UpdateResult> {
    return this.userRepository.update(userId, {
      twoFactorAuthenticationSecret: secret,
    });
  }

  /**
   * turnOnTwoFactorAuthentication
   * @param : user id
   * @returns : update info
   */
  turnOnTwoFactorAuthentication(userId: number): Promise<UpdateResult> {
    return this.userRepository.update(userId, {
      isTwoFactorAuthenticationEnabled: true,
    });
  }

  /**
   * isUserTwoFactorAuthEnabled
   * @param : user id
   * @returns : boolean
   */
  async isUserTwoFactorAuthEnabled(id: number): Promise<boolean> {
    const user = await this.getOneById(id);
    if (!user) {
      throw new HttpException(
        `This User ${id} does not exist !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.isTwoFactorAuthenticationEnabled === true) {
      return true;
    }
    return false;
  }

  /**
   * turnOffTwoFactorAuthentication
   * @param : user id
   * @returns : update info
   */
  async turnOffTwoFactorAuthentication(userId: number): Promise<User> {
    const user = await this.getOneById(userId);
    user.isTwoFactorAuthenticationEnabled = false;
    user.twoFactorAuthenticationSecret = null;
    return this.userRepository.save(user);
  }

  /**
   * Change all users status to offline.
   */
  resetUserStatus(): Promise<UpdateResult> {
    return this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ userStatus: OnlineStatus.OFFLINE })
      .where('userStatus != :status', { status: OnlineStatus.OFFLINE })
      .execute();
  }

  /**
   * Change user status to specific value.
   */
  setUserStatus(userId: number, status: OnlineStatus): Promise<UpdateResult> {
    return this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ userStatus: status })
      .where('id = :id', { id: userId })
      .execute();
  }

  /****************************************************************************/
  /*                              site admin                                  */
  /****************************************************************************/

  async getBannedUserIds(): Promise<number[]> {
    const users = await this.userRepository.find({
      where: { siteStatus: SiteStatus.BANNED },
      select: ['id'],
    });
    const ids = users.map((obj) => obj.id);
    return ids;
  }

  async modifyUserSiteStatus(
    id: number,
    setUserSiteStatusDto: SetUserSiteStatusDto,
  ): Promise<User> {
    if (id === setUserSiteStatusDto.id) {
      throw new HttpException(
        `You cannot modify your own site status !`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const [operator, user] = await Promise.all([
      this.getOneById(id),
      this.getOneById(setUserSiteStatusDto.id),
    ]);

    this.checkUserExisted(operator);
    this.checkUserExisted(user);
    if (setUserSiteStatusDto.newStatus === OptionSiteStatus.MODERATOR) {
      await this.setModerator(operator, user);
    } else if (setUserSiteStatusDto.newStatus === OptionSiteStatus.USER) {
      await this.setUser(operator, user);
    } else if (setUserSiteStatusDto.newStatus === OptionSiteStatus.BANNED) {
      await this.banUser(operator, user);
    }
    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.nickname',
        'user.avatar',
        'user.userStatus',
        'user.siteStatus',
      ])
      .where('user.id = :id', { id: user.id })
      .execute();
  }

  setModerator(operator: User, user: User): Promise<User> {
    if (operator.siteStatus !== SiteStatus.OWNER) {
      throw new HttpException(
        `You don't have the right to set site moderators !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    user.siteStatus = SiteStatus.MODERATOR;
    return this.userRepository.save(user);
  }

  setUser(operator: User, user: User): Promise<User> {
    if (
      operator.siteStatus !== SiteStatus.OWNER &&
      operator.siteStatus !== SiteStatus.MODERATOR
    ) {
      throw new HttpException(
        `You don't have the right to change user site status !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      (operator.siteStatus === SiteStatus.MODERATOR &&
        user.siteStatus === SiteStatus.OWNER) ||
      (operator.siteStatus === SiteStatus.MODERATOR &&
        user.siteStatus === SiteStatus.MODERATOR)
    ) {
      throw new HttpException(
        `You don't have the right to change the status of the site owner 
        or moderator, you need to have a higher status to do this !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.siteStatus === SiteStatus.USER) {
      throw new HttpException(
        `The appointed user's site status is already user !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    user.siteStatus = SiteStatus.USER;
    return this.userRepository.save(user);
  }

  banUser(operator: User, user: User): Promise<User> {
    if (
      operator.siteStatus !== SiteStatus.OWNER &&
      operator.siteStatus !== SiteStatus.MODERATOR
    ) {
      throw new HttpException(
        `You don't have the right to ban a user !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      (operator.siteStatus === SiteStatus.MODERATOR &&
        user.siteStatus === SiteStatus.OWNER) ||
      (operator.siteStatus === SiteStatus.MODERATOR &&
        user.siteStatus === SiteStatus.MODERATOR)
    ) {
      throw new HttpException(
        `You don't have the right to ban the site owner or moderator,
        you need to have a higher status to do this !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.siteStatus === SiteStatus.BANNED) {
      throw new HttpException(
        `The appointed user's site status is already banned !`,
        HttpStatus.BAD_REQUEST,
      );
    }
    user.siteStatus = SiteStatus.BANNED;
    user.isTwoFactorAuthenticationEnabled = false;
    user.twoFactorAuthenticationSecret = null;
    return this.userRepository.save(user);
  }

  /****************************************************************************/
  /*                                 checkers                                 */
  /****************************************************************************/

  checkUserExisted(user: User): void {
    if (!user) {
      throw new HttpException(
        `This user does not exist !`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /****************************************************************************/
  /*                                 utils                                    */
  /****************************************************************************/

  getAllWithConditions(id: number): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :Id', { Id: id })
      .select(['user.id', 'user.nickname', 'user.avatar', 'user.userStatus'])
      .orderBy('id', 'ASC')
      .getMany();
  }

  async getUserNameList(): Promise<string[]> {
    const users = await this.getAll();
    const names = users.map((obj) => obj.nickname);
    return names;
  }

  /****************************************************************************/
  /*                            Database File                                 */
  /****************************************************************************/

  async uploadDatabaseFile(
    id: number,
    dataBuffer: Buffer,
    filename: string,
  ): Promise<DatabaseFile> {
    const newFile = this.databaseFilesRepository.create({
      filename,
      data: dataBuffer,
      userId: id,
    });
    return this.databaseFilesRepository.save(newFile);
  }

  async getFileById(fileId: number): Promise<DatabaseFile> {
    const file = await this.databaseFilesRepository.findOne(fileId);
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }
}
