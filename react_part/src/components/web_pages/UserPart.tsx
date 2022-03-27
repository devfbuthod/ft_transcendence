import 'bootstrap/dist/css/bootstrap.min.css'
import { Button, Row, Col, ButtonGroup, ToggleButton } from 'react-bootstrap'
import React, {useState, useContext, useEffect} from 'react'
import axios from 'axios';
import CreateChannelButton from '../chat/Channel/create_channel';
import ListChannel from "../chat/Channel/ListChannel";
import ListPrivateConversation from "../chat/PrivateConversation/ListPrivateConversation"
import {SocketContext} from '../../context/socket'
import InterfaceMembers from '../members/members';
import LeaveChannelButton from '../chat/Channel/LeaveChannelModal'
import './UserPart.css'
import InterfaceChat from '../chat/ChatInterface';
import {IBlockedUser} from '../members/ListBlockedUsers'

export type Role = 'Owner' | 'Admin' | 'User';

export interface IChannel {
    channel_id: number,
    channel_name: string,
    channel_type: 'Public' | 'Private',
    role: Role,
}

export interface IPrivateConversation {
    conversation_id: number,
    conversation_name: string,
}

export interface IUserConversation {
    user_id: number,
}

export type messageType = 'Channel' | 'MP'

/* * ALL THE USER INTERFACE */

export const SwitchContext = React.createContext((userId: number) => {});

function InterfaceUser() {

    const [interfaceRadioValue, setinterfaceRadioValue] = useState<string>('Channel');
    const [channelSelected, setChannelSelected] = useState<IChannel | undefined>();
    const [UserConversationSelected, setUserConversationSelected] = useState<IUserConversation | undefined>();
	const [BlockedUsers, SetBlockedUsers] = useState<IBlockedUser[]>([])
	const [ReloadBlockedUserlist, SetReloadBlockedUserlist] = useState<number>(0);
    const socket = useContext(SocketContext);

    const channelradios = [
        {name: 'Channels', value: 'Channel'},
        {name: 'private message', value: 'MP'},
    ]

    useEffect(() => {
        socket.on('channel-need-reload', () => socket.emit('ask-reload-channel'));
        return(() => {socket.off('channel-need-reload');})
    }, [socket])

	//get list blocked at the mount of the component + start listening socket
	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/me/list?status=block', {withCredentials: true,})
		.then(res => {
           if(isMounted)
           {
                SetBlockedUsers(res.data);
                const Blocked : IBlockedUser[]= res.data;
                if (interfaceRadioValue === 'MP' && UserConversationSelected !== undefined &&
                    Blocked.find((user) => UserConversationSelected.user_id === user.user_id) !== undefined)
                    setUserConversationSelected(undefined);
            }
		})
		.catch(res => { if (isMounted)
			console.log("error on getting data blocked users");
		})

		socket.on("reload-block", () => {SetReloadBlockedUserlist(ReloadBlockedUserlist + 1); });

		return (() => { socket.off("reload-block"); isMounted = false; });

	}, [ReloadBlockedUserlist, socket, interfaceRadioValue, UserConversationSelected]);

    function SwitchPrivateConversation(userId: number)
    {
        setinterfaceRadioValue('MP');
        setUserConversationSelected({user_id: userId});
    }

    function ResetChannel() { setChannelSelected(undefined)}

    function InterfaceChannel() {
        return (
        <Row>
        <ButtonGroup className="mb-2">
            {channelradios.map((radio, idx) => (
                <ToggleButton
                id={`channelradio-${idx}`}
                name="radio"
                key={idx % 2 ? 'channels' : 'private message'}
                type='radio'
                variant={idx % 2 ? 'outline-success' : 'outline-danger'}
                value = {radio.value}
                checked={interfaceRadioValue === radio.value}
                onChange={(e) => setinterfaceRadioValue(e.currentTarget.value)}
                >
                    {radio.name}
                </ToggleButton>
            ))}
        </ButtonGroup>

        <Col lg={12}>
            {interfaceRadioValue ==='Channel' ?
            <ListChannel channelSelected={channelSelected} setChannelSelected={setChannelSelected}/>
            : <ListPrivateConversation UserConversationSelected={UserConversationSelected} setUserConversationSelected={setUserConversationSelected} BlockedUsers={BlockedUsers}/>}
        </Col>
        <Col>
            {interfaceRadioValue ==='Channel' ?
                <div style={{ marginBottom: '5px'}}>
                    <CreateChannelButton socketid={socket}/>
                    { channelSelected !== undefined ?
                        <LeaveChannelButton channel={channelSelected} CallBackFunction={ResetChannel} />
                    :   <Button disabled className="ButtonCreate bg-secondary"> Leave Channel</Button>}
                </div>
                : <div></div>
            }
        </Col>
        </Row>
    )}

	return (
        <SwitchContext.Provider value={SwitchPrivateConversation}>
        <div>
        <Row as={InterfaceChannel}/>
        <Row>
          <Col className="ColumnChat" sm={{span: 8}} style={{borderRight:"1px solid #aaa", height: "48em"}}>
              <InterfaceChat channelSelected={channelSelected} privateSelected={UserConversationSelected}
              messageType={interfaceRadioValue === 'MP' ? 'MP' : 'Channel'}/>
          </Col>
          <Col className="ColumnChat" sm={{span: 4}} >
            <InterfaceMembers />
          </Col>
        </Row>
        </div>
        </SwitchContext.Provider>
	);
}

export default InterfaceUser;
