import { Row, Col, } from 'react-bootstrap'
import InterfaceUser from './UserPart'
import Game from '../Game'
import "./Home.css"
import "../members/members.css"
import Notifications from '../Notifications'


function Home() {
    return (
        <div>
            <Notifications/>
			<Row className="gx-3">
				<Col xl={8} lg={12}>
					<div className="p-3 border bg-white shadow-sm">
						<Game/>
					</div>
				</Col>
				<Col xl={4} lg={12}>
					<div className="p-3 border bg-white shadow-sm">
						<InterfaceUser/>
					</div>
				</Col>
			</Row>
        </div>
    )
}

export default Home;