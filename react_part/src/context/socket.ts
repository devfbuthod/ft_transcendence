import React from 'react'
import io, { Socket } from "socket.io-client";

export const socket:Socket = io('http://' + process.env.REACT_APP_DOMAIN_BACKEND, {withCredentials: true,});
export const SocketContext: React.Context<any>  = React.createContext(undefined);