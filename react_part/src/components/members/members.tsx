
import { ButtonGroup, ToggleButton } from 'react-bootstrap'
import {useState} from 'react'
import './members.css'
import ListFriends from './ListFriends'
import ListUsers from './ListUsers'
import ListBlockedUsers from './ListBlockedUsers'
import ListFriendRequests from './ListFriendRequests'

export default function InterfaceMembers()
{
    const [radioMembersValue, setMembersRadioValue] = useState('1');
    const membersradios = [
		{name: 'Friends', value: '1', variant: 'outline-primary'},
		{name: 'Users', value: '2', variant: 'outline-secondary'},
		{name: 'Blocked', value: '3', variant: 'outline-danger'},
		{name: 'Friend Requests', value: '4', variant: 'outline-warning'}
    ]
    return (
		<div>
		    <ButtonGroup className='userListMenu' vertical>
			{membersradios.map((radio, idx) => (
			    <ToggleButton
			    id={`membersRadio-${idx}`}
			    name="membersRadio"
			    key={radio.name}
			    type='radio'
			    variant={radio.variant}
			    value={radio.value}
			    checked={radioMembersValue === radio.value}
			    onChange={(e) => setMembersRadioValue(e.currentTarget.value)}
			    >
				{radio.name}
			    </ToggleButton>
			))}
		    </ButtonGroup>
		    { radioMembersValue === '1' ? <ListFriends />
		    : radioMembersValue === '2' ? <ListUsers/>
		    : radioMembersValue === '3' ? <ListBlockedUsers/>
		    : 				  <ListFriendRequests/> }
		</div>
	)
}