import { User } from './user/model/user.entity';

declare module 'express' {
  export interface Request {
    user?: User;
  }
}
