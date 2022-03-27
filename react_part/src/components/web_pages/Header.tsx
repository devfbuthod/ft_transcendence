import { useContext } from 'react';
import "./Header.css";

import axios from 'axios';
import { useEffect, useState} from "react";
import { Image } from "react-bootstrap";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';
import {LinkContainer} from 'react-router-bootstrap';
import logoPong from '../pictures/ping-pong.png';
import { DataContext, SiteStatus } from '../../App';

function Header () {
    const [isConnected, setConnexion] = useState(true);
    const [user_avatar, setAvatar] = useState("")
    const [id, setId] = useState(0);
    const [nick, setNick] = useState<string>('');
    const userData = useContext(DataContext);

    useEffect(() => {
		let isMounted = true;

        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/me/',{
            withCredentials:true,
        })
        .then(res => {
			if (isMounted) {
            setId(res.data.id);
            setAvatar(res.data.avatar)
			setNick(res.data.nickname)
            setConnexion(true);
			}
        })
        .catch(res => {
            setConnexion(false);
        });
		return (() => {isMounted = false});
    }, []);

    if (isConnected)
    { // https://cdn-icons.flaticon.com/png/128/3322/premium/3322434.png?token=exp=1636118252~hmac=d6b9c64cb59fc8fcdd055bbebc86fbb8
		return (
			<Navbar className='Header shadow-sm' bg='white' expand="lg"  >
				<Container fluid>
    				<LinkContainer to='/'>
						<Navbar.Brand>
							<Image src={logoPong} alt="Logo" />
							Pong
						</Navbar.Brand>
					</LinkContainer>
					<Navbar.Toggle aria-controls="responsive-navbar-nav" />
					<Navbar.Collapse id="responsive-navbar-nav">
						<Nav className="me-auto">
							<LinkContainer to='/ladder'><Nav.Link>Ladder</Nav.Link></LinkContainer>
							<Nav.Link>{userData.siteStatus} of the website</Nav.Link>
						</Nav>
						<Nav>
							<NavDropdown className="NavProfile" id="responsive-nav-dropdown" align="end" title={
								<span>
									{nick}
									<Image className="Avatar" src={`${user_avatar}`} alt='avatar' roundedCircle/>
								</span>
								}>
									{(userData.siteStatus === SiteStatus.OWNER || userData.siteStatus === SiteStatus.MODERATOR)
									&& <LinkContainer to='/admin'><NavDropdown.Item>Admin View</NavDropdown.Item></LinkContainer>}
									<LinkContainer to={'/profile/'+id}><NavDropdown.Item>Profile</NavDropdown.Item></LinkContainer>
									<LinkContainer to='/settings'><NavDropdown.Item >Settings</NavDropdown.Item></LinkContainer>
									<NavDropdown.Divider />
									<LinkContainer to='/disconnect'><NavDropdown.Item>Logout</NavDropdown.Item></LinkContainer>
							</NavDropdown>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
		);
    }
    else
	{
        return (
			<Navbar collapseOnSelect bg="light" style={{fontSize:'20px'}}>
			<Container fluid>
    		<Navbar.Brand style={{paddingLeft:"50px", fontSize:'30px'}} href="/">
				<Image src={logoPong} style={{position:'relative', marginBottom:'6px', marginRight:'10px'}} width="40" height="40" alt="" />
			Pong
			</Navbar.Brand>
			<Navbar.Collapse className="justify-content-end" >
			<Nav style={{paddingRight:'10px'}}>
    		<Nav.Link href={'http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/auth/login/'}>Log in</Nav.Link>
			</Nav>
			</Navbar.Collapse>

			</Container>
		</Navbar>
        );
    }
}
// /login
export default Header;
