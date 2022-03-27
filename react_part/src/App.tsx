import './App.css';
import "bootswatch/dist/lux/bootstrap.min.css"
import Router from './components/Router';
import {SocketContext, socket} from './context/socket'

import axios from 'axios'
import React, { useState, useEffect } from 'react';
// import './bootswatch.scss';

enum OnlineStatus {
	AVAILABLE = 'Available',
	PALYING = 'Playing',
	OFFLINE = 'Offline',
      }

export enum SiteStatus {
  OWNER = 'Owner',
  MODERATOR = 'Moderator',
  USER = 'User',
  BANNED = 'Banned',
}

export interface Data {
  id: number,
  nickname: string,
  avatar: string,
  createDate: Date,
  userStatus: OnlineStatus,
  siteStatus: SiteStatus,
  email: string,
  isTwoFactorAuthenticationEnabled: boolean,
}

const emptyuser: Data = {id: 0, nickname: "", avatar: "", createDate: new Date(1980,1,2, 12,34,56),
userStatus: OnlineStatus.AVAILABLE, siteStatus: SiteStatus.USER, email: "", isTwoFactorAuthenticationEnabled: false};
export const DataContext = React.createContext(emptyuser);

function App():React.ReactElement {

  const [userData, SetuserData] = useState<Data>(emptyuser);

  useEffect(() => {
    let isMounted = true;
    axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/me', {withCredentials: true})
    .then((res) => {if(isMounted) {SetuserData(res.data)} })
    .catch(res => {if(isMounted) {console.log(`You must login : ${res.data}`)}})
    return (() => {isMounted = false});
  }, [])

//add useEffect for changing status site

  return (
    <DataContext.Provider value={userData}>
    <SocketContext.Provider value={socket}>
      <div className="App">
        <Router/>
      </div>
    </SocketContext.Provider>
    </DataContext.Provider>
  );
}

export default App;