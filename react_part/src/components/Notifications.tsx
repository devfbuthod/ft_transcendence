import { useEffect, useState } from 'react';
import {Toast, ToastContainer } from 'react-bootstrap'
import { socket } from '../context/socket';
import { gameSocket } from '../context/gameSocket';
import {useBetween} from 'use-between'

type NotificationType = 'success' | 'warning' | 'danger'

export interface INotification
{
	type: NotificationType
	message: string,
}

export const useShareableState = () => {
	const [NotificationList, SetNotifications] = useState<INotification[]>([]);
	return {
		NotificationList,
		SetNotifications,
	}
}

function ToastComponent(props: {Notification: INotification, idx: number, closeNotif: Function})
{
	return (
		<div key={`Toast_${props.idx}`}>
		<Toast bg={props.Notification.type} onClose={() => props.closeNotif(props.idx)} delay={10000} autohide>
			<Toast.Header>
				<strong style={{width: "21em"}}> Notification </strong>
			</Toast.Header>
			<Toast.Body>
				{`${props.Notification.message}`}
			</Toast.Body>
		</Toast>
		</div>
	)
}

function Notifications() {

	const { NotificationList, SetNotifications} = useBetween(useShareableState);

	function closeNotif(idx: number)
	{
		NotificationList.splice(idx, 1);
		SetNotifications([...NotificationList]);
	}

	useEffect(() =>
	{
		socket.on('alert', (data: {alert: INotification}) => {
			NotificationList.push(data.alert);
			SetNotifications([...NotificationList]);
		});
        gameSocket.on('alert', (data: {alert: INotification}) => {
			NotificationList.push(data.alert);
			SetNotifications([...NotificationList]);
		});
		return (() => {
            socket.off('alert');
            gameSocket.off('alert');
        })
	}, [NotificationList, SetNotifications]);

    return (
 	<div style={{zIndex:2}}>
		<ToastContainer position='top-start' className='ToastList'>
			{ NotificationList.map((Notification, idx) => ToastComponent({Notification, idx, closeNotif})) }
		</ToastContainer>
	</div>
    )
}
export default Notifications;