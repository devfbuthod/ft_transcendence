import React from 'react'
import io, { Socket } from "socket.io-client";

export const gameSocket:Socket = io('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/pong', {withCredentials: true,});
export const GameSocketContext: React.Context<any> = React.createContext(undefined);