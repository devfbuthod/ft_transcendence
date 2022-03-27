import {Button} from 'react-bootstrap'
import { ContextMenuTrigger, ContextMenu, MenuItem} from 'react-contextmenu'
import {InvitateToGame, SpectateGame} from '../../members/ContextMenuFunctions';
import { gameSocket } from '../../../context/gameSocket';
import { useHistory } from 'react-router'
import {useState, useContext} from 'react'
import {socket, SocketContext} from '../../../context/socket'
import {DataContext} from '../../../App'
import {Modal, Form} from 'react-bootstrap'
import {IUser} from '../ChatInterface'
import {Role, SwitchContext} from '../../web_pages/UserPart'

type backdrop_type = boolean | "static" | undefined

interface IPropsModal {
	show: boolean,
	onHide: () => void,
	backdrop: backdrop_type,
	sanctionstatus: 'mute' | 'ban',
	user: IUser | undefined,
	channelid: number,
      }

export default function ListChannelUser(props: {ListUsers: IUser[], myrole: Role, channelId: number,})
{
	function ContextMenuChannelUser(props: {
		user: IUser,
		myrole: Role,
		channelId: number,
		ShowModal: () => void,
		SetMute: () => void,
		SetBan: () => void,
		SetUser: (user: IUser) => (void)})
	{
		if (props.user === undefined)
			return(<div></div>);

		const Mygrade = props.myrole === 'Owner' ? 3 : props.myrole === 'Admin' ? 2 : 1;
		const Usergrade = props.user.role === 'Owner' ? 3 : props.user.role === 'Admin' ? 2 : 1;

		return (<div>
			{props.user.user_id === userData.id ?
				<ContextMenu id={`ContextMenuChannelUser_${props.user.user_id}`}>
					<MenuItem onClick={() => history.push(`/profile/${props.user.user_id}`)}>
						View Profile
					</MenuItem>
				</ContextMenu>
			:
				<ContextMenu id={`ContextMenuChannelUser_${props.user.user_id}`}>
					<MenuItem onClick={() => history.push(`/profile/${props.user.user_id}`)}>
						View Profile
					</MenuItem>
					<MenuItem onClick={() => SwitchPrivateConversation(props.user.user_id)}>
						Send a message
					</MenuItem>
			        <MenuItem onClick={() => InvitateToGame(props.user.user_id, gameSocket)}>
				        Invite to game
			        </MenuItem>
			        <MenuItem onClick={() => SpectateGame(props.user.user_id, gameSocket)}>
				        Spectate Game
			        </MenuItem>
					{ Mygrade > Usergrade &&
					<div>
					<MenuItem onClick={() => {props.SetMute(); props.SetUser(props.user); props.ShowModal()}}>
						Mute
					</MenuItem>
					<MenuItem onClick={() => {props.SetBan(); props.SetUser(props.user); props.ShowModal()}}>
						Ban
					</MenuItem>
					</div>}
					{ Mygrade > Usergrade && props.user.status !== 'Normal' &&
						<MenuItem onClick={() => {
						socket.emit('channel-status-change', {
							channelId: props.channelId,
							userId: props.user.user_id,
							sanctionDuration: 0,
							status: "Normal"
						})
						}}>
							Remove the sanction
						</MenuItem>
					}
					{ Mygrade === 3 && Usergrade === 1 &&
					<MenuItem onClick={() => {socket.emit("channel-admin", {channelId: props.channelId, participantId: props.user.user_id, action: 'Set'})}}>
						Promote Admin
					</MenuItem>
					}
					{ Mygrade === 3 && Usergrade === 2 &&
					<MenuItem onClick={() => {socket.emit("channel-admin", {channelId: props.channelId, participantId: props.user.user_id, action: 'Unset'})}}>
						Demote to User
					</MenuItem>
					}
				</ContextMenu>
			}
			</div>
			)
	}

	function ChannelUser(props: {user: IUser, myrole: Role, channelId: number})
	{
		const [ViewModal, SetViewModal] = useState(false);
		const onHide = () => SetViewModal(false);
		const ShowModal = () => SetViewModal(true);

		const [SanctionStatus, SetSanctionStatus] = useState<'mute' | 'ban'>('mute');
		const SetMute = () => SetSanctionStatus('mute');
		const SetBan = () => SetSanctionStatus('ban');

		const [UserModal, SetUserModal] = useState<undefined | IUser>(undefined);
		const SetUser = (user: IUser) => SetUserModal(user);

		return(
			<div>
				<ContextMenuTrigger id={`ContextMenuChannelUser_${props.user.user_id}`}>
					<Button disabled style={{width: "80%", margin: "0.5%"}}>
						{props.user.user_nickname}
					</Button>
				</ContextMenuTrigger>
				<ContextMenuChannelUser
				{...props}
				ShowModal={ShowModal}
				SetMute={SetMute}
				SetBan={SetBan}
				SetUser={SetUser}
				/>
				<SanctionModal
					show={ViewModal}
					onHide={onHide}
					backdrop="static"
					sanctionstatus={SanctionStatus}
					user={UserModal}
					channelid={props.channelId}
				/>
			</div>
		)
	}
	let history = useHistory();
	const userData = useContext(DataContext);
	const socket = useContext(SocketContext);
	const SwitchPrivateConversation = useContext(SwitchContext);

	return (
		<div className="overflow-auto" style={{marginTop: "10px"}}>
			{props.ListUsers.map((User: IUser) =>
			<ChannelUser key={`channel_user_${User.user_id}`} user={User} myrole={props.myrole} channelId={props.channelId}/>)}
		</div>
	)
}


function convertTime(s_time: string)
{
	if (s_time === "5min")
		return (5);
	else if (s_time === "15min")
		return (15);
	else if (s_time === "1hour")
		return (60);
	else if (s_time === "8hours")
		return (60 * 8);
	else if (s_time === "1day")
		return (60 * 24);
	else if (s_time === "15days")
		return (60 * 24 * 15);
	return (0);
}

function SanctionModal(props: IPropsModal)
{
	const [time, setTime] = useState<string>("");

	function onHide()
	{
		setTime("");
		props.onHide();
	}

	function SubmitForm(event: any)
	{
		event.preventDefault();
/* 		console.log({
			channelId: props.channelid,
			userId: props.user?.user_id,
			sanctionDuration: convertTime(time),
			status: props.sanctionstatus.charAt(0).toUpperCase() + props.sanctionstatus.slice(1),
		}) */
		if (time !== "")
		{

			socket.emit('channel-status-change', {
				channelId: props.channelid,
				userId: props.user?.user_id,
				sanctionDuration: convertTime(time),
				status: props.sanctionstatus.charAt(0).toUpperCase() + props.sanctionstatus.slice(1),
			})
			onHide()
		}
		event.stopPropagation()
	}

	if (props.user === undefined)
		return (<div></div>);
	return (
		<Modal
		{...props}
		aria-labelledby="contained-modal-title-vcenter"
		centered
		style={{color:"black"}}>
			<Modal.Header closeButton>
				<Modal.Title id="contained-modal-title-vcenter">
					How long do you want to {props.sanctionstatus} {props.user.user_nickname} ?
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form>
					{props.sanctionstatus === "mute" ?
					<Form.Select aria-label="Default select example"
						value={time}
						onChange={(e: any) => {setTime(e.target.value);}}
					>
						<option value="">Time {props.sanctionstatus}</option>
						<option value="5min">5 minutes</option>
						<option value="15min">15 minutes</option>
						<option value="1hour">1 hour</option>
						<option value="8hours">8 hours</option>
						<option value="1day">1 day</option>
					</Form.Select>
					:
					<Form.Select aria-label="Default select example"
						value={time}
						onChange={(e: any) => {setTime(e.target.value);}}
					>
						<option value="">Time {props.sanctionstatus}</option>
						<option value="5min">5 minutes</option>
						<option value="15min">15 minutes</option>
						<option value="1hour">1 hour</option>
						<option value="8hours">8 hours</option>
						<option value="1day">1 day</option>
						<option value="15days">15 days</option>
						<option value="permanent">permanent </option>
					</Form.Select>
					}
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="primary" onClick={SubmitForm} >
					Submit
				</Button>
				<Button variant="secondary" onClick={onHide}>
					Cancel
				</Button>
			</Modal.Footer>
		</Modal>
	)
}