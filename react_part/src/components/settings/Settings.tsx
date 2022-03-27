import { ChangeNickName } from './ChangeNickName';
import { ChangeTwoFA } from './ChangeTwoFA';
import { ChangeImage } from './ChangeImage';
import { Col, Row } from 'react-bootstrap';

function Parametre () {

    return (
		<Row className='gx-3'>
			<Col xl={4} lg={12}>
				<div className="p-3 border bg-white shadow-sm">
					<ChangeNickName/>
				</div>
			</Col>
			<Col xl={4} lg={12}>
				<div className="p-3 border bg-white shadow-sm">
					<ChangeImage/>
				</div>
			</Col>
			<Col xl={4} lg={12}>
				<div className="p-3 border bg-white shadow-sm">
					<ChangeTwoFA/>
				</div>
			</Col>
		</Row>
    )
}

export default Parametre;