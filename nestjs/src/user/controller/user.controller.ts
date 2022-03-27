import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  PayloadTooLargeException,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from '../model/create-user.dto';
import { UserService } from '../service/user.service';
import { User } from '../model/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUser } from 'src/auth/decorator/currrent.user.decorator';
import { ChangeUserNameDto } from '../model/change-username.dto';
import { JwtTwoFactorGuard } from 'src/auth/guard/jwt-two-factor.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { Readable } from 'stream';
import { UserGateway } from '../user.gateway';

@UseGuards(JwtAuthGuard)
@UseGuards(JwtTwoFactorGuard)
@Controller('profile')
export class UserController {
  constructor(
    private userService: UserService,
    private userGateway: UserGateway,
  ) {}

  /**
   * getCurrentUser
   * @returns : id, nickname, createDate, userStatus, siteStatus, email, 2fa enable
   */
  @Get('me')
  getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return this.userService.getOneById(user.id);
  }

  /**
   * getAll
   * @returns : all users with id, nickname, createDate, userStatus, email
   */
  @Get('all')
  getUsers(): Promise<User[]> {
    return this.userService.getAll();
  }

  /**
   * getUserProfileById
   * @param : user id
   * @returns : the user with id, nickname, createDate, userStatus, email
   */
  @Get(':id')
  getUserProfileById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.getUserProfileById(id);
  }

  /**
   * createUser locally, it returns the new user
   * have to delete later
   */
  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUserWithDto(createUserDto);
  }

  /**
   * changeUserName
   */
  @Patch('name')
  async changeUserName(
    @CurrentUser() user: User,
    @Body() changeUserNameDto: ChangeUserNameDto,
  ): Promise<User> {
    await this.userService.changeUserName(user.id, changeUserNameDto);
    this.userGateway.server.to('user-' + user.id).emit('reload-profile');
    return this.userService.getOneById(user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<string> {
    if (file.mimetype.indexOf('image') === -1) {
      throw new HttpException(
        `The file mimetype ${file.mimetype} is not acceptable.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const index = file.mimetype.indexOf('/', 0);
    if (index !== -1) {
      const type = file.mimetype.slice(index + 1);
      const acceptExtension = ['jpeg', 'jpg', 'png', 'gif'];
      if (!acceptExtension.includes(type)) {
        throw new HttpException(
          `The file mimetype ${type} is not acceptable.`,
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
    } else {
      throw new HttpException(
        `The file mimetype has a problem.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    if (file.size > 1024 * 1024) {
      throw new PayloadTooLargeException();
    }
    await this.userService.addAvatar(user.id, file.buffer, file.originalname);
    this.userGateway.server.to('user-' + user.id).emit('reload-profile');
    return `Image ${file.originalname} uploaded successfully !`;
  }

  @Get('avatarfile/:id')
  async getDatabaseFileById(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.userService.getFileById(id);
    const stream = Readable.from(file.data);

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': 'image',
    });

    return new StreamableFile(stream);
  }
}
