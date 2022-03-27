import React, { useState, useEffect, useContext } from "react"
import { Col, Row, Button, Image } from "react-bootstrap"
import {SocketContext} from "../../../context/socket"
import './ListChannel.css'
import PadlockImage from "../../pictures/Padlock-symbol.png"
import GlobeImage from "../../pictures/earth-globe-world-globe-drawing-sticker.jpeg"
import CrownImage from "../../pictures/Crown.jpg"
import StarImage from "../../pictures/star1.jpeg"
import MSNImage from "../../pictures/people.jpeg"
import NormalImage from "../../pictures/volume-on.png"
import MuteImage from "../../pictures/volume-off.jpeg"
import BlockImage from "../../pictures/redx.png"
import JoinChannelModal from "./JoinChannelModal"
import {IChannel, Role} from '../../web_pages/UserPart'

export interface IMyChannel {
        channel_id: number,
        channel_name: string,
        channel_type: 'Private' | 'Public'
        role: Role;
        status: 'Normal' | 'Mute' | 'Ban';
}

export interface IOtherChannel {
        channel_id: number,
        channel_name: string,
        channel_type: 'Private' | 'Public'
}

interface IUseStateChannel {
        channelSelected: IChannel | undefined;
        setChannelSelected: React.Dispatch<React.SetStateAction< IChannel | undefined>>
}

function ListChannel(props: IUseStateChannel) {
        let socket = useContext(SocketContext);
        const [MyChannels, SetMyChannels] = useState<IMyChannel[]>([]);
        const [OthersChannels, SetOthersChannels] = useState<IOtherChannel[]>([]);
        const [ShowJoinModal, setShowJoinModal] = useState(0);

        useEffect( () => {
                socket.emit("ask-reload-channel");
                }, [socket])

        useEffect(() => {
                socket.on("channels-user-in", (data: IMyChannel[]) => {
                        SetMyChannels(data);
                        //reload ChannelSelected if his role in the channel or the type of the channel change
                        let NewSelectedChannel = MyChannels.find((elem) => elem.channel_id === props.channelSelected?.channel_id);
                        if (NewSelectedChannel !== undefined && props.channelSelected !== undefined
                                && (NewSelectedChannel.role !== props.channelSelected.role || NewSelectedChannel.channel_type))
                                props.setChannelSelected({...NewSelectedChannel});
                        //set ChannelSelected to undefined if ChannelSelected doesn't exist anymore
                        if (props.channelSelected !== undefined && data.find((channel) => channel.channel_id === props.channelSelected?.channel_id) === undefined)
                                props.setChannelSelected(undefined);
                });
                socket.on("channels-user-out", (data: IOtherChannel[]) => SetOthersChannels(data));
                return (() => {
                        socket.off("channels-user-in");
                        socket.off("channels-user-out");
                });
        }, [MyChannels, OthersChannels, socket, props]);

        function ButtonMyChannel(Channel: IMyChannel) {
                let channel_id = Channel.channel_id;
                let channel_name = Channel.channel_name;
                let role = Channel.role;
                let channel_type = Channel.channel_type;
                let isDestroying = false;

                return (
                <div key={channel_id}>
					<Button className="ButtonChannel ButtonMyChannel " onClick={(e) => {
							if (!isDestroying)
									props.setChannelSelected({channel_id, channel_name, channel_type, role,})
							else
									isDestroying = false;
							}}>
							{Channel.channel_type === 'Private' ?
							<Image src={PadlockImage} className="LogoChannel" roundedCircle alt="padlock"/>
							: <Image src={GlobeImage} className="LogoChannel" roundedCircle alt="globe"/>}

							{Channel.channel_name}

							{Channel.role === 'Owner' ?
							<Image src={CrownImage} className="LogoChannel" roundedCircle alt="crown"/>
							: Channel.role === "Admin" ?
							<Image src={StarImage} className="LogoChannel" roundedCircle alt="star"/>
							: <Image src={MSNImage} className="LogoChannel" roundedCircle alt="people"/>}

							{Channel.status === 'Normal' ?
							<Image src={NormalImage} className="LogoChannel" roundedCircle alt="normal"/>
							: Channel.status !== "Mute" ?
							<Image src={MuteImage} className="LogoChannel" roundedCircle alt="mute"/>
							: <Image src={BlockImage} className="LogoChannel" roundedCircle alt="block"/>}
					</Button>
                </div>
                )
        }

        function ButtonOtherChannel(Channel: IOtherChannel) {
                let channel_id = Channel.channel_id;
                let channel_name = Channel.channel_name;
                let isDestroying = false;

                return (
                        <div key={channel_id}>
							<Button  className="ButtonChannel ButtonOtherChannel"
							onClick={(event) => { !isDestroying ? setShowJoinModal(channel_id) : isDestroying = false; }}>

									{Channel.channel_type === 'Private' ?
									<Image src={PadlockImage} className="LogoChannel" roundedCircle alt="padlock"/>
									: <Image src={GlobeImage} className="LogoChannel" roundedCircle alt="globe"/>}
									{channel_name}
							</Button>
							<JoinChannelModal
							show={ShowJoinModal === channel_id}
							onHide={() => {setShowJoinModal(0);}}
							backdrop="static"
							channel={Channel}
							/>
                        </div>
                )
        }

	return(
                <Row className="ScrollingListChannel">
                        <Col className="ChannelsJoined" sm={6} >
                                { MyChannels.length !== 0
                                        ?
                                        <div>
                                                <h4> My Channels </h4>
                                                <div style={{overflow: 'auto', maxHeight: '15em'}} >
                                                        { MyChannels.map(ButtonMyChannel) }
                                                </div>
                                        </div>
                                        : <div/>
                                }
                        </Col>
                        <Col className="ChannelsNotJoinded" style={{overflow: 'auto'}} sm={6}>
                                { OthersChannels.length !== 0
                                        ?
                                        <div>
                                                <h4> Other Channels </h4>
                                                <div style={{overflow: 'auto', height: '7.9em'}}>
                                                        {OthersChannels.map(ButtonOtherChannel)}
                                                </div>
                                        </div>
                                        : <div/>
                                }
                        </Col>
                </Row>
	)
}

export default ListChannel