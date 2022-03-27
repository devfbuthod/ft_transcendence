import { Form, Button, Alert } from 'react-bootstrap'
import { useState } from 'react'

import axios from 'axios';

export const ChangeNickName = () => {
    const [nickname, setNickname] = useState("");
    const [alert, setAlert] = useState(0);
    const [msg, setMsg] = useState([])

    function modifyNickname () {
        axios.patch('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/name/',{nickname: nickname},
        {withCredentials:true,
        })
        .then(res => {
            setAlert(0)
            window.location.reload();
        })
        .catch(res => {
            setMsg(res.response.data.message)
            setAlert(1)
        })
    }

    function SubmitNickname(event: any) {
        event.preventDefault();
        modifyNickname();
    }

    function changeNickName(e: React.ChangeEvent<HTMLInputElement>) { setNickname(e.currentTarget.value);}

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
		<Form onSubmit={SubmitNickname} >
			<h4>Change nickname</h4>
			{showAlert()}
			<Form.Group className="mb-3">
				<Form.Control type="text" value={nickname} name="nickname" placeholder="Enter your new nickname" onChange={changeNickName} />
			</Form.Group>

			<Button variant="primary" type="submit">Submit</Button>
		</Form>
    );
}