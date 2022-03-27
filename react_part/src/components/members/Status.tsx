import { Badge } from 'react-bootstrap'
import './Status.css'

type StatusType = 'Available' | 'Playing' | 'Offline';

function status(status: StatusType)
{
	if (status === 'Offline')
	{
		return (<Badge className="position-absolute top-0 start-100 translate-middle rounded-pill" bg='danger'>
			{/* Offline */}
			Offline
		</Badge>);
	} else if (status === 'Available') {
		return (<Badge className="position-absolute top-0 start-100 translate-middle rounded-pill" bg='success'>
			{/* Offline */}
			Online
		</Badge>);	
	} else if (status === 'Playing')
	{
		return (<Badge className="position-absolute top-0 start-100 translate-middle rounded-pill" bg='warning'>
			{/* Offline */}
			In Game
		</Badge>);
	}
}

export default status;