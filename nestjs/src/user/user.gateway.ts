import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: 'http://' + process.env.DOMAIN_FRONTEND,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class UserGateway {
  @WebSocketServer()
  server: any;
}
