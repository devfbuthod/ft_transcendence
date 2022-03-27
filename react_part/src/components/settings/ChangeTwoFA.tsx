import { Form, Button, Image, Alert } from 'react-bootstrap'
import { useState , useContext} from 'react'
import {DataContext} from "../../App"
import axios from 'axios';

export const ChangeTwoFA = () => {
    const userData = useContext(DataContext);
    const [printQR, setPrintQR] = useState(0)
    const [code, setCode] = useState("")
    const [alert, setAlert] = useState(0);
    const [msg, setMsg] = useState([]);
    const [errMsg, setError] = useState<string>('');

    function turnOn() {
        axios.post('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/2fa/turn-on/',{twoFactorAuthenticationCode: code},
            {withCredentials:true,
        })
        .then(res => {
            setAlert(0)
            window.location.reload();
        })
        .catch(res => {
            let mess: string;
            if (Array.isArray(res.response.data.message)) 
            mess = res.response.data.message.join(' and ');
            else
            mess = res.response.data.message;
            setError(mess);
            setAlert(1)
        })
    }

    function twoFactorAuth() {
        if (printQR !== 1) {
            axios.defaults.withCredentials = true;
            axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/2fa/generate/', {
                withCredentials:true,
            })
            .then(res => {
                setPrintQR(1);
                setAlert(0)
            })
            .catch(res => {
                setMsg(res.response.data.message)
                setAlert(2)
            })
        }
    }

    function turnOff() {
        axios.defaults.withCredentials = true;
        axios.delete('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/2fa/turn-off/', {
            withCredentials:true,
        })
        .then(res => {
            window.location.reload();
            setAlert(0)
        })
        .catch(res => {
            let mess: string;
            if (Array.isArray(res.response.data.message)) 
                mess = res.response.data.message.join(' and ');
            else
                mess = res.response.data.message;
            setError(mess);
            setAlert(1);
        })
    }

    function SubmitCode(event: any) {
        event.preventDefault();
        turnOn();
    }

    function ChangeCode(e: React.ChangeEvent<HTMLInputElement>) { setCode(e.currentTarget.value);}

    function showAlert2 () {
        let items = []

        if (alert === 2){
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

    function showAlert () {
        
        if (alert === 1){
            return (
            <div>
                <Alert variant={'danger'}> {errMsg} </Alert>
            </div>)
        }
    }

    function PrintQRCode () {
        if (printQR) {
            return (
                <div>
                    <Form onSubmit={SubmitCode} >
                        {showAlert2()}
                    	<Image src={'http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/2fa/generate/'} alt='QRCode 2fa'/>
						<Form.Group className="mb-3">
                    		<Form.Control type="code" value={code} name="code" placeholder="Enter the 6 digits code" onChange={ChangeCode} />
						</Form.Group>
                        <Button variant="primary" type="submit">Activate</Button>
                    </Form>
                </div>
            )
        }
    }

    return (
        <div>
            <h4>Activate 2FA</h4>
            {showAlert()}
            {userData.isTwoFactorAuthenticationEnabled ? <Button onClick={turnOff} type="submit">desactivate</Button> :<Button onClick={twoFactorAuth} type="submit">activate</Button>}
            {PrintQRCode()}
        </div>
    )
}