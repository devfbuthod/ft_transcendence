
import axios from 'axios'
import { Socket } from "socket.io-client";

export function InvitateToGame(id: number, gameSocket:Socket)
{
    gameSocket.emit('tryToInvite', id);
}

export function SpectateGame(id: number, gameSocket:Socket)
{
	gameSocket.emit('spectate', id);
}

export function Unfriend(id: number)
{
	axios.delete('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/unfriend', {withCredentials: true, data: {addresseeUserId: id}})
	.catch((res) => console.log(res));
}

export function Askfriend(id: number)
{
	axios.post('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/add', {addresseeUserId: id}, {withCredentials: true})
	.catch((res) => console.log(res));
}

export function Block(id: number)
{
	axios.post('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/block', {addresseeUserId: id}, {withCredentials: true})
	.catch((res) => console.log(res));
}

export function Unblock(id: number)
{
	axios.delete('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/unblock', {withCredentials: true, data: {addresseeUserId: id}})
	.catch((res) => console.log(res));
}

/*
	Approve or Decline a friend invitation
	param: relationship_id: id of the request, isAccepted: does the user accept or decline the invitation
*/
export function ValidationFriend(relationship_id: number, isAccepted: boolean, CallBackfunction: () => void)
{
	if (isAccepted)
	{
		axios.patch(`http://${process.env.REACT_APP_DOMAIN_BACKEND}/relationship/accept/${relationship_id}`, {}, {withCredentials: true,})
		.then(res => {CallBackfunction()})
		.catch(res => console.log(`error in ValidationFriend: ${res}`));
	}
	else
	{
		axios.delete(`http://${process.env.REACT_APP_DOMAIN_BACKEND}/relationship/reject/${relationship_id}`, {withCredentials: true,})
		.then(res => CallBackfunction())
		.catch(res => console.log(`error in ValidationFriend: ${res}`));
	}
}
