import { Button, Alert, Form } from 'react-bootstrap'
import { useState } from 'react'

import axios from 'axios';

export const ChangeImage = () => {
    const [alert, setAlert] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
    const [msg, setMsg] = useState([])

    const handleImageChange = function (e: React.ChangeEvent<HTMLInputElement>) {
        const fileList = e.target.files;
    
        if (!fileList)
            return;
        setSelectedFile(fileList[0]);
      };

    const uploadFile = function (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        if (selectedFile === undefined)
            return ;
        const formData = new FormData();
        formData.append("file", selectedFile, selectedFile.name);
        axios.post('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/upload',
            formData,
            {withCredentials: true})
        .then(res => {
            setAlert(0)
            setSelectedFile(undefined);
            window.location.reload();
        })
        .catch(res => {
            setAlert(1)
            setMsg(res.response.data.message);
        });
    };

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
		<Form>
			<h4>Change profile picture</h4>
			{showAlert()}
			<Form.Group className="mb-3">
				{/* <label >
					<input className="btn btn-default" type="file" onChange={handleImageChange} />
				</label> */}
				<Form.Label>We do not resize the image send us square image for an optimal result. <br />We only accept: png, jpg, jpeg. </Form.Label>
    <			Form.Control type="file" onChange={handleImageChange} />
			</Form.Group>

			<Button variant='primary'
				disabled={!selectedFile}
				onClick={uploadFile}>
				Upload
			</Button>
		</Form>
    )
}