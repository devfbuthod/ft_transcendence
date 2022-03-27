import axios from 'axios';
import { useState, useEffect } from "react";
import {Image, Table} from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';

export default function Ladder() {
    const [games, setGames] = useState([]);
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        let isMounted = true;
        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/game/all',{
            withCredentials:true,
        })
        .then(res => { if (isMounted) {
                setGames(res.data);
            }
        })
        .catch(res => { if (isMounted) {
                console.log("err");
            }
        })


        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/profile/all',{
            withCredentials:true,
        })
        .then(res => {
            if (isMounted) {
                setProfiles(res.data);
            }
        })
        .catch(res => {

        })
        return () => { isMounted = false };
    }, [])

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

    function fillData(){
        var list:number[]
        var listWinner:number[][]
        var data = []
        var max = 0;
        var comp = 0;
        var res;
        var res2;
        list = [];
        listWinner = [];
        games.forEach(({id, mode, status, updateDate, leftUserId, leftUserScore, rightUserId, rightUserScore, winnerId}) => {
            if (winnerId != null)
                list.push(winnerId)
        })
        for (let i = 0; list[i]; i++){
            res = 0
            res2 = 0
            max = 0
            for (let j = 0; list[j]; j++){
                if (list[i] === list[j])
                    res += 1
            }
            for (let k = 0; listWinner[k]; k++) {
                if (listWinner[k][0] === list[i])
                    res2 = 1
            }
            if (res2 === 0) {
                listWinner.push([list[i], res])
            }
        }
        for(let i = 0; listWinner[i]; i++) {
            if (listWinner[i][1] > max)
                max = listWinner[i][1]
        }
        for(let j = max; j >= 0; j--) {
            for(let i = 0; listWinner[i]; i++) {
                if (listWinner[i][1] === j ) {
                    comp++
                    var user = {image:getPicture(listWinner[i][0]), position:comp, name:getName(listWinner[i][0]), score:listWinner[i][1], id:listWinner[i][0]};
                    data.push(user)
                }
            }
        }
        return(data)
    }

    function printLadder () {
        var data = fillData()
        return (
            <tbody>
                {data.map(({image, position, name, score, id}) => {
                    return (
						<tr key={`${id}`}>
							<td>{position}</td>
							<td> 
								<LinkContainer to={'/profile/'+id}>
                                    <Image src={`${image}`} width="40" height="40" alt="Avatar" rounded/>
                                </LinkContainer>
							</td>
							<td>{name}</td>
							<td>{score}</td>
						</tr>
                    )
                })}
            </tbody>
        )
    }

    return (
		<div className="p-3 border bg-white shadow-sm">
			<h2>Ladder</h2>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Position</th>
						<th>Avatar</th>
						<th>Name</th>
						<th>Score</th>
					</tr>
				</thead>
				{printLadder()}
			</Table>
		</div>
    )
}