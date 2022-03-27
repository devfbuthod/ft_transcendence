import React, { useEffect, useState } from "react";
import '../members/Status';
import axios from 'axios';
import {Image, Row, Col, Badge, ListGroup} from 'react-bootstrap'
import { LinkContainer } from "react-router-bootstrap";
import {useParams} from "react-router-dom";
import './Profile.css'
import status from "../members/Status";

export default function Profile() {

    const [validate, setValidate] = useState(true);
    const [name, setName] = useState("");
    const [idMain, setId] = useState(0);
    const [avatar, setAvatar] = useState("")
    const [friends, setFriends] = useState([]);
    const [games, setGames] = useState([]);
    const [profiles, setProfiles] = useState([]);

    const { clientId }: { clientId: string } = useParams();

    useEffect(() => {
        let isMounted = true;
        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/' + clientId,{
            withCredentials:true,
        })
        .then(res => {
            if (isMounted) {
                setName(res.data.nickname)
                setId(res.data.id)
                setAvatar(res.data.avatar)
            }
        })
        .catch(res => {
            if (isMounted) {
                setValidate(false);
            }
        })

        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/relationship/'+clientId+'/list?status=friend',{
            withCredentials:true,
        })
        .then(res => {
            if (isMounted) {
                setFriends(res.data)
            }
        })
        .catch(res => {
            if (isMounted) {
                setValidate(false);
            }
        })

        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/game/'+clientId+'/records',{
            withCredentials:true,
        })
        .then(res => {
            if (isMounted) {
                setGames(res.data)
            }
        })
        .catch(res => {
            if (isMounted) {
                setValidate(false);
            }
        })

        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/all',{
            withCredentials:true,
        })
        .then(res => {
            if (isMounted) {
                setProfiles(res.data)
            }
        })
        .catch(res => {
            if (isMounted) {
                setValidate(false);
            }
        })
        return () => { isMounted = false };
    }, [clientId]);

    /*
    printStatus (id: number) {
        let tab = this.getStatus(id)
        for (let i = 0; i < tab.length; i++) {
            if (tab[i] === undefined) {
                tab.splice(i)
            }
        }
        console.log(tab)
        if (this.getStatus(id).indexOf(1) === 0)
            return (<img src="https://www.png-gratuit.com/img/cercle-rouge-fond-transparent.png" className="img-fluid" alt="orange circle" width="20"/>)
        else if (this.getStatus(id) === 1)
            return (<img src="https://www.png-gratuit.com/img/cercle-vert-fond-transparent.png" className="img-fluid" alt="orange circle" width="20"/>)
        else
            return (<img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Rond_orange.png" className="img-fluid" alt="orange circle" width="20"/>)    
    }

    */

    function getPicture (iduser:number):string {
        let url:string = "";
        profiles.forEach(({id, nickname, avatar, date, status, email, twoFactor}) => {
            if (iduser === id)
                url = avatar;
        })
        return(url);
    }

    function getName (iduser:number):string {
        let name:string = "";
        profiles.forEach(({id, nickname, avatar, date, status, email, twoFactor}) => {
            if (iduser === id)
                name = nickname;
        })
        return(name);
    }

    function winningMatches ():number {
        let total:number = 0;
        games.forEach(({id, mode, date, updateDate, userScore, opponentId, opponentScore, userGameStatus}) => {
            if (userGameStatus === "Won")
                total += 1;
        })
        return (total);
    }

    function lostMatches ():number {
        let total:number = 0;
        games.forEach(({id, mode, date, updateDate, userScore, opponentId, opponentScore, userGameStatus}) => {
            if (userGameStatus === "Lost")
                total += 1;
        })
        return (total)
    }

    function printFriendsList () {
		if (friends.length === 0)
			return (
				<h5>They have no friend but they have curly ! 😀🍫</h5>
			);
        return (
            <ListGroup variant="flush" key={"printFriendsList"}>
                {friends.map(({user_id, user_nickname, user_avatar, user_siteStatus}) => {
                    return (
						<ListGroup.Item key={`profile-${user_id}`}>
							<LinkContainer to={"/profile/"+user_id}>
								<Row>
									<Col><Image src={`${user_avatar}`} className="Avatar" alt="Friend Avatar"/></Col>
										<Col>{status(user_siteStatus)}</Col> {/* because is triangle */}
									<Col>{user_nickname}</Col>
								</Row>
							</LinkContainer>
						</ListGroup.Item>
                    );
                })
                }
            </ListGroup>
        )
    }

    function printMatchsScore () {
        return (
            <div key={"printMatchsScore"}>
                {games.map(({gameId, mode, date, updateDate, userScore, opponentId, opponentScore, userGameStatus}) => {
                    return ( 
                        <div key={`${gameId}-matchsScore`}>
                            <Row>
                                <Col style={{ maxWidth: '4.5rem'}}>
                                    <Image className="Avatar" src={`${getPicture(idMain)}`} alt="Avartar"/>
                                </Col>
                                <Col style={{textAlign: 'center'}}>
									<div>{` ${userScore} - ${opponentScore} `}</div>
									<div>{` ${name} ` } Vs {` ${getName(opponentId)} `}</div>      
                                </Col>
                                <Col style={{ maxWidth: '4.5rem'}}>
									<LinkContainer to={'/profile/'+opponentId}>
                                        <Image className="Avatar" src={`${getPicture(opponentId)}`} alt="Avatar"/>
                                    </LinkContainer>
                                </Col>
                            </Row>
                        </div>
                    )
                })}
            </div>
        )
    }

    function Validate() {
        return (
			<Row className="Profile">
				<Col className="Matches" xl={6} lg={12}>
					<Image src={`${avatar}`} className="ProfileAvatar border shadow-sm" alt="Avatar" roundedCircle/>
					<div className="p-3 border bg-white shadow-sm">
						<h3>{name}</h3>
						<span>Total matches win : <Badge bg="success">{winningMatches()}</Badge></span>
						<span>Total matches lost : <Badge bg="danger">{lostMatches()}</Badge></span>
						<hr />
						{printMatchsScore()}
					</div>
				</Col>
				<Col className="Friends" xl={6} lg={12}>
					<div className="p-3 border bg-white shadow-sm">
						<h4>Friends</h4>
						<hr />
						{printFriendsList()}
					</div>
				</Col>
			</Row>
        )
    }

    function Unvalidate() {
        return (
            <div> Error profile doesn't exist</div>
        )
    }

    function PrintProfile() {
        if (validate === false)
            return <Unvalidate/>;
        else
            return <Validate/>;
    }

    return (
        <PrintProfile/>
    )
}