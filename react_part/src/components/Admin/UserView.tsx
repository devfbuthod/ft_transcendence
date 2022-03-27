import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Form, Col, Row, Button, Image, Modal, Alert} from "react-bootstrap";
import { Data, DataContext, } from "../../App";
import { SocketContext } from "../../context/socket";


enum SiteStatus {
	OWNER = 'Owner',
	MODERATOR = 'Moderator',
	USER = 'User',
	BANNED = 'Banned',
}

type backdrop_type = boolean | "static" | undefined

interface IPropsModal {
	show: boolean,
	onHide: () => void,
	backdrop: backdrop_type,
	user: Data | undefined,
}

function UserButton(props: {thisUser: Data, myData: Data, setSiteUser: any, setViewModal: any})
{


	return(
		<Row style={{backgroundColor: 'grey', borderStyle: 'solid', borderWidth: '0.01em'}}>
			<Col ><Image src={props.thisUser.avatar} fluid style={{height: '3em'}}></Image></Col>
			<Col>{props.thisUser.nickname}</Col>
			<Col>{props.thisUser.siteStatus}</Col>
			<Col>
			{ 	props.thisUser.siteStatus !== SiteStatus.OWNER &&
				props.thisUser.id !== props.myData.id &&
				<div>
				<style type="text/css">
					{`
					.btn-black {
					background-color: black;
					color: white;
					}
					`}
				</style>
				<Button variant="black" size="lg"
				onClick={() => {
					props.setSiteUser(props.thisUser);
					props.setViewModal(true);
				}}>
					Change Status
				</Button>
				</div>
			}
			</Col>
		</Row>
	)
}

function UserModal(props: IPropsModal)
{
	const [NewSiteStatus, setNewSiteStatus] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<any>(undefined);

	function SubmitForm(event: any) {
		event.preventDefault();
        setErrorMsg(undefined);
		if (props.user !== undefined && NewSiteStatus !== "")
		{
			axios.patch('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/admin/set', {id: props.user.id, newStatus: NewSiteStatus}, {withCredentials: true})
			.then((res) => onHide())
			.catch(res => {if (res.response.data.message) setErrorMsg(res.response.data.message); });
		}
	}
 
	function onHide(){
        setErrorMsg(undefined);
		setNewSiteStatus("");
		props.onHide();
	}

	return(
		<div>

		{ props.user !== undefined ?
		<Modal
		{...props}
		size="lg"
		aria-labelledby="contained-modal-title-vcenter"
		centered
		>
		<Modal.Header closeButton>
		  <Modal.Title id="contained-modal-title-vcenter">
		{ props.user !== undefined &&
		    `Change status of ${props.user.nickname}`}
		  </Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<Form>
                {errorMsg && <Alert key={"alertkey"} variant='danger'> {errorMsg}  </Alert>}
			<Form.Select aria-label="Change Status Site"
				onChange={(e: any) => {setNewSiteStatus(e.target.value)}}
				>
				<option value={""}> Change Status Site </option>
				{props.user.siteStatus !== SiteStatus.MODERATOR && <option value={SiteStatus.MODERATOR}>Set to Moderator </option>}
				{props.user.siteStatus !== SiteStatus.USER && <option value={SiteStatus.USER}>Set to Normal User</option>}
				{props.user.siteStatus !== SiteStatus.BANNED && <option value={SiteStatus.BANNED}>Set to Banned</option>}
			</Form.Select>
			</Form>
		</Modal.Body>
		<Modal.Footer>

			<Button variant="primary" onClick={SubmitForm}>
				Confirm
			</Button>
			<Button variant="secondary" onClick={onHide}>
				Cancel
			</Button>
		</Modal.Footer>
		</Modal>
	:<div></div>}
	</div>
	)
}

export default function UserView()
{
	const [listUser, setListUser] = useState<Data[]>([]);
	const [siteUser, setSiteUser] = useState<undefined | Data>(undefined);
	const [ReloadUserList, setReloadUserList] = useState<number>(0);
	let myData = useContext(DataContext);
	const socket = useContext(SocketContext);


	const [ViewModal, SetViewModal] = useState(false);
	const onHide = () => SetViewModal(false);

	useEffect(() => {
		let isMounted = true;
		axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/all', {withCredentials: true,})
		.then(res => {
			if (isMounted)
				setListUser(res.data);
		})
		.catch(res => {
			if (isMounted)
				console.log(`error get admin list : ${res.data}`);
		})
		socket.on('reload-users', () => {setReloadUserList(ReloadUserList + 1);})
		return(() => {
			isMounted = false;
			socket.off('reload-users');
		});
	}, [ReloadUserList, socket])

	return (
		<div style={{overflow: 'auto', backgroundColor: '#D7DBDD', height: '70em', fontSize: '2em'}}>
			{ listUser.map((user) =>
			(<UserButton
				thisUser={user}
				myData={myData}
				setSiteUser={setSiteUser}
				setViewModal={SetViewModal}
				key={`user-view-${user.id}`}
			/>)) }
			<UserModal show={ViewModal} onHide={onHide} backdrop="static" user={siteUser}/>
		</div>
	)
}