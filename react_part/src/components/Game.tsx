import React, {useEffect, useState, useContext} from 'react';
import {Button, Image, Spinner, Popover, OverlayTrigger} from 'react-bootstrap'
import './Game.css'
import Container from 'react-bootstrap/Container';
import {GameSocketContext} from './../context/gameSocket';
import {Socket} from 'socket.io-client';
import useStore from './pong/hooks/useStore';
import Pong from './pong/components/Pong';
import clearStore from './pong/components/ClearStore';

type GameInfos = {
    pLName: string;
    pLAvatar: string;
    pRName: string;
    pRAvatar: string;
}

const Game:React.FC = () => {
    const [toggleMatchMaking, setToggleMatchMaking] = useState<boolean>();
	const gameStatus = useStore(s => s.gameStatus);
	const [watch, setWatch] = useState<number>(0);
	const setGameStatus = useStore(s => s.setGameStatus);
    const socket:Socket = useContext(GameSocketContext);
	
    useEffect(() => {
        let isMounted = true;
        socket.on('spectateOn', (e:number) => {
            setWatch(e);
            if (gameStatus !== 2)
                setGameStatus(0);
        })
		if (gameStatus === 0 ) socket.emit('isInMatchmaking?'); 
        if (gameStatus !== 2) {
        	socket.on('inMatchMaking', (e) => {
        	    if (isMounted) {
        	    	setToggleMatchMaking(e);
        	    }
        	});
        }
        socket.on('startPong', (e:GameInfos) => {
            if (isMounted) {
			setGameStatus(2);
            useStore.setState((s) => ({...s, playerR:{name:e.pRName, avatar:e.pRAvatar}, playerL:{name:e.pLName, avatar:e.pLAvatar} }));
            }
        } );
		socket.on('startPongBonus', (e:GameInfos) => {
            if (isMounted) {
			setGameStatus(2);
            useStore.setState((s) => ({...s, bonus:true, playerR:{name:e.pRName, avatar:e.pRAvatar}, playerL:{name:e.pLName, avatar:e.pLAvatar} }));
            }
        } );
        socket.on('startWatch', (e:GameInfos) => {
            if (isMounted) {
            clearStore();
            useStore.setState((s) => ({...s, bonus:true, playerR:{name:e.pRName, avatar:e.pRAvatar}, playerL:{name:e.pLName, avatar:e.pLAvatar} }));
            }
        } );
		socket.on('resetGameModal', () => {
			if (gameStatus === 1 || gameStatus === 3)
				setGameStatus(0);
		});
        return (() => {
			socket.off('spectateOn');
            socket.off('startPong');
            socket.off('inMatchMaking');
			socket.off('startPongBonus');
            socket.off('startWatch');
			socket.off('resetGameModal');
            isMounted = false;
        })
    }, [gameStatus, socket, setGameStatus])
    
    const handleClickON = () => socket.emit('matchmakingON');
    const handleClickOFF = () => socket.emit('matchmakingOFF');
	const handleClickONBonus = () => socket.emit('BonusmatchmakingON');
    const stopSpectating = () => socket.emit('stopSpectating', watch);

    function showButtons():JSX.Element {
        return (
        <div className="row align-self-center">
            <div className="col">
                    <Button variant="outline-warning" onClick={handleClickON}>Join a normal game</Button>
                </div>
                <div className="col">
                    <Button variant="outline-warning" onClick={handleClickONBonus}>Join a bonus game</Button>
                </div>
                <div className="col">
                <OverlayTrigger
                  trigger="click"
                  key='right'
                  placement='right'
                  overlay={
                    <Popover id={`popover-positioned-right`}>
                      <Popover.Header as="h3">Game Ruleset</Popover.Header>
                      <Popover.Body>
                         <strong>Normal game :</strong><br/>
                          🏓 you must send the ball in the enemy field to score 🏒<br/>
                          🏓 when you score <strong>seven</strong> times, you win the game 7️🏆<br/>
                          🏓 If you <strong>quit</strong>, even if it's not your fault, you <strong>lose</strong>. 😰<br/><br/>
                        <strong>Bonus Game :</strong><br/>
                          🏓 sometime a white bubble appears on your or your enemy's field. 🧋<br/>
                          🏓 you can control your enemy's bubble with ⬆️ and ⬇️, if it's going to leave the screen, do not worry, it will transplane to the other side. 🧙🏼‍♂️<br/>
                          🏓 you must catch your own bubble to get one bonus 🎉<br/>
                          🏓 your bonus is shown just before your name, you must <strong>hit space bar</strong> to use it. 😈<br/>
                          🏓 We'll let you discover your powers 🦠🔥🦠🕳️🦠🔥🦠

                      </Popover.Body>
                    </Popover>
                  }
                >
                  <Button variant="outline-warning">Game Ruleset</Button>
                </OverlayTrigger>
                </div>
				<Image src={process.env.PUBLIC_URL + '/pongbackground.jpg'} style={{width:'100%', height:'1000px', objectFit:'cover', objectPosition:'center',}}fluid />
        </div>
        );
    }

    function waitingForGame():JSX.Element {
        return (
		<Container className='no-padding' fluid >
			<Image style={{width:'100%', height:'1000px', objectFit:'cover', objectPosition:'center',}} src='https://media4.giphy.com/media/gx54W1mSpeYMg/giphy.gif'/>
            <Button variant="outline-warning" className='button' onClick={handleClickOFF}>Exit the Matchmaking</Button>
			<div className='over'>waiting for a game <Spinner animation="border" variant="light" /></div> 
		</Container>
		);
    }

    function leaveSpectateButton():JSX.Element {
        return (
            <Button variant="outline-warning" onClick={stopSpectating}>stop spectating</Button>
        );
    }

	return (
        <Container className='no-padding' fluid>
			{gameStatus === 2 || watch !== 0 ? <Pong /> : toggleMatchMaking ? waitingForGame() : showButtons()}
            {watch !== 0 ? leaveSpectateButton() : null}
		</Container>
	);
}
// https://culturezvous.com/wp-content/uploads/2018/09/ping-pong-the-animation-109667.jpg
// https://media4.giphy.com/media/gx54W1mSpeYMg/giphy.gif
// https://thumbs.dreamstime.com/z/one-continuous-line-drawing-young-sporty-woman-table-tennis-player-practicing-her-smash-hit-competitive-sport-concept-single-201088082.jpg
// https://images.takeshape.io/fd194db7-7b25-4b5a-8cc7-da7f31fab475/dev/c235b62a-9442-4325-b9c9-ec1b7bfcb8f2/xdVFewf.gif?w=1200&q=80 popup defi
export default Game;

// TODO POSTICO