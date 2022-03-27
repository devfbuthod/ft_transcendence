import { PassportStrategy } from '@nestjs/passport';
import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { stringify } from 'querystring';
import { lastValueFrom } from 'rxjs';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/model/user.entity';
import { UserGateway } from 'src/user/user.gateway';

const clientID = process.env.OAUTH_42_APP_ID;
const clientSecret = process.env.OAUTH_42_APP_SECRET;
const callbackURL =
  'http://' + process.env.DOMAIN_BACKEND + '/auth/42/callback';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, 'forty-two') {
  constructor(
    private userServices: UserService,
    private http: HttpService,
    private userGateway: UserGateway,
  ) {
    super({
      authorizationURL: `https://api.intra.42.fr/oauth/authorize?${stringify({
        client_id: clientID,
        redirect_uri: callbackURL,
        response_type: 'code',
        scope: 'public',
        state: '54v4646v54dsdfjkhjksdjskfnjksdjkfds8f2s',
      })}`,
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      scope: 'public',
      clientID,
      clientSecret,
      callbackURL,
    });
  }

  async validate(accessToken: string): Promise<User> {
    const { data } = await lastValueFrom(
      this.http.get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    if (!data) throw new UnauthorizedException();

    /* Check if user is already created */
    let user = await this.userServices.getOneById(data.id);

    /* If not, create new user in database */

    if (!user) {
      user = await this.userServices.createUser(data);
      setTimeout(() => {
        this.userGateway.server.to('user-' + user.id).emit(`alert`, {
          alert: {
            type: `info`,
            message:
              'You can change your name, avatar by going to your settings page.',
          },
        });
      }, 2000);
    }

    return user;
  }
}
