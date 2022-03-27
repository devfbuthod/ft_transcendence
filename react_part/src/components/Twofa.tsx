import { Form, Button, Alert, Image } from 'react-bootstrap'
import { useHistory } from "react-router-dom";
import LogoPong from "./pictures/ping-pong.png";
import "./web_pages/connexion.css"

import React, { useState, useCallback } from 'react'
import axios from 'axios';

interface STATE {
    setConnection:Function;
    //isConnected:boolean;
}

const Twofa = (props:STATE) => {
    const [code, setCode] = useState("")
    const [alert, setAlert] = useState(0);
    const [msg, setMsg] = useState([])
    const setConnection = props.setConnection;
    let history = useHistory();

    const SubmitCode = useCallback(
        async (event) => {
        event.preventDefault();
        await axios.post('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/2fa/authenticate',{twoFactorAuthenticationCode: code},
            {withCredentials:true,
        })
        .then(res => {
            setAlert(0)
            setConnection(1);
            window.location.reload();
        })
        .catch(res => {
            if (res.response.status === 403 && res.response.data.message === "User is banned by the site.")
                    history.push("/ban");
            else {
                setMsg(res.response.data.message)
                setAlert(1)
            }
        })
           // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, setConnection, ]);


    function ChangeCode(e: React.ChangeEvent<HTMLInputElement>) { setCode(e.currentTarget.value);}

    function showAlert () {
        let items = []

        if (alert === 1){
            if (msg.length <= 2) {
                for(let i = 0; i < msg.length; i++) {
                    items.push(<Alert key={i} variant={'danger'}> {msg[i]} </Alert>)
                }
                return (
                    <div>
                        {items}
                    </div>
                )
            }
            else {
                return (
                    <div>
                        <Alert variant={'danger'}> {msg} </Alert>
                    </div>
                )
            }
        }
    }


    return (
        <div className="login shadow-sm">
            <Image className="logo-pong" src={LogoPong} alt="pong logo"/>
            <h1>Pong</h1>
            <Form onSubmit={SubmitCode} >
            <Form.Control type="code" value={code} name="code" placeholder="Enter the 6 digits code" onChange={ChangeCode} />
                <Button variant="success" type="submit">
                    Submit two factor authentication code
                </Button>
            </Form>
            {showAlert()}
            <span className="credits">Codé avec beaucoup de <i style={{color: "pink"}}>♥</i> par <a href="https://profile.intra.42.fr/users/abourbou" title="Arthur Bourbousson">abourbou</a>,{' '}
            <a href="https://profile.intra.42.fr/users/lolopez" title="Lou Lopez">lolopez</a>,{' '}
            <a href="https://profile.intra.42.fr/users/fgalaup" title="Félix Galaup">fgalaup</a>,{' '}
            <a href="https://profile.intra.42.fr/users/yictseng" title="Yiching Tseng">yictseng</a>,{' '}
            <a href="https://profile.intra.42.fr/users/fbuthod-" title="Fabien Buthod Garcon">fbuthod-</a>.
    </span>
        </div>
    )
}

export default Twofa;