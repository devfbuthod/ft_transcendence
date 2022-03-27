import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { Button, Modal, ToggleButton, ToggleButtonGroup, Form,} from "react-bootstrap";

type backdrop_type = boolean | "static" | undefined

interface Props {
  show: boolean,
  onHide: () => void,
  backdrop: backdrop_type,
  socket: Socket
}

function CreateChannelModal(props: Props) {

    const [isPrivate, setIsPrivate] = useState(true);
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");


    function SubmitForm(event: any) {
        event.preventDefault();
        let data = {name: name, password: password};
        props.socket.emit('channel-create', data);
        onHide();
    }

    function onHide(){
      setPassword("");
      setIsPrivate(true);
      props.onHide();
    }

    function ChangeName(e: React.ChangeEvent<HTMLInputElement>) { setName(e.currentTarget.value);}
    function ChangePassword(e: React.ChangeEvent<HTMLInputElement>) {
      if (isPrivate)
        setPassword("");
      else
        setPassword(e.currentTarget.value);}

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      style={{color:"black"}}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Create Channel
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form className="w-50 p-3 " onSubmit={SubmitForm} >
          <ToggleButtonGroup name='typeChannel' className="mb-3" defaultValue={"public"} type='radio'>
            <ToggleButton value ={"public"} id="publicChannel" type='radio' variant="primary" onClick={() => {setIsPrivate(true); setPassword("")}}>
              Public Channel
            </ToggleButton>
            <ToggleButton value={"private"} id="privateChannel" type='radio' variant="primary" onClick={() => {setIsPrivate(false)}}>
              Private Channel
            </ToggleButton>
          </ToggleButtonGroup>
          <Form.Label> Channel Name </Form.Label>
          <Form.Control type="text" name="name" placeholder="Channel Name" className="mb-4" onChange={ChangeName} required/>
          
          { !isPrivate ? 
          <div style={{height:"6em"}}>
            <Form.Label>
              Password
            </Form.Label>
            <Form.Control required type="password" className="mb-3" value={password} name="password" placeholder="Password" onChange={ChangePassword}/>
          </div>
          : <div style={{height:"6em"}}/>}
          
          <Button variant="success" type="submit">
              Create Channel
          </Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
            Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function CreateChannelButton(props: {socketid: Socket}) {
  const [modalShow, setModalShow] = React.useState(false);

  return (
    <React.Fragment>
      <Button className='ButtonCreate bg-danger' onClick={() => setModalShow(true)}>
        Create Channel
      </Button>
      <CreateChannelModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        backdrop="static"
        socket={props.socketid}
      />
    </React.Fragment>
  )
}

export default CreateChannelButton;