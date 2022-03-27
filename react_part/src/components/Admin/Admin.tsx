import { useState } from "react";
import { Row, Col, Nav, } from "react-bootstrap";
import UserView from "./UserView";
import ChannelView from "./ChannelView";

enum View {
	USER = "User",
	CHANNEl = "Channel",
}

function Admin()
{
	const [viewValue, setViewValue] = useState<View>(View.USER);

	return(
	<Row>
		<Col lg={3}>
			<Nav
			defaultActiveKey="user"
			onSelect={(selectedKey) => {setViewValue(selectedKey === "user" ? View.USER : View.CHANNEl)}}
			variant='pills'
			//style={{background: "#29699E", color: "black"}}
			className="flex-column"
			>
				<Nav.Link eventKey="user">User</Nav.Link>
				<Nav.Link eventKey="channel">Channel</Nav.Link>
			</Nav>
		</Col>
		<Col style={{backgroundColor: "#D7DBDD"}}>
		{viewValue === View.USER
		?	<UserView/>
		:	<ChannelView/>
		}
		</Col>
	</Row>
	)
}

export default Admin;