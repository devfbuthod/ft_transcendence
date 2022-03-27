import './Ban.css'
import { Container} from 'react-bootstrap'
import axios from 'axios';
import {useState, useEffect} from 'react';
import { useHistory } from "react-router-dom";


export default function Ban()
{
    const [res, setRes] = useState<number>(0);
    let history = useHistory();
    var root = document.documentElement;
    var eyef = document.getElementById('eyef');
    var cx = eyef?.getAttribute("cx");
    var cy = eyef?.getAttribute("cy");
    
    document.addEventListener("mousemove", evt => {
      let x = evt.clientX / window.innerWidth;
      let y = evt.clientY / window.innerHeight;
    
      root.style.setProperty("--mouse-x", x.toString());
      root.style.setProperty("--mouse-y", y.toString());
      
      cx = (115 + 30 * x).toString();
      cy = (50 + 30 * y).toString();
      eyef?.setAttribute("cx", cx);
      eyef?.setAttribute("cy", cy);
      
    });
    
    document.addEventListener("touchmove", touchHandler => {
      let x = touchHandler.touches[0].clientX / window.innerWidth;
      let y = touchHandler.touches[0].clientY / window.innerHeight;
    
      root.style.setProperty("--mouse-x", x.toString());
      root.style.setProperty("--mouse-y", y.toString());
    });
    useEffect(() => {
    }, [res])
    function onDisconnection() {
        axios.get('http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/auth/disconnect',{
            withCredentials:true,
        })
        .then(res => {
            setRes(1);
            window.location.reload();
        })
        .catch(res => {
            setRes(2);
            history.push("/login");
        })
    }
	return (
		<Container id="ban" fluid>
<svg xmlns="http://www.w3.org/2000/svg" id="robot-error" viewBox="0 0 260 118.9">
            <defs>
                <clipPath id="white-clip"><circle id="white-eye" fill="#cacaca" cx="130" cy="65" r="20" /> </clipPath>
             <text id="text-s" className="error-text" y="106"> 403 </text>
            </defs>
              <path className="alarm" fill="#e62326" d="M120.9 19.6V9.1c0-5 4.1-9.1 9.1-9.1h0c5 0 9.1 4.1 9.1 9.1v10.6" />
             <use xlinkHref="#text-s" x="-0.5px" y="-1px" fill="black"></use>
             <use xlinkHref="#text-s" fill="#2b2b2b"></use>
            <g id="robot">
              <g id="eye-wrap">
                <use xlinkHref="#white-eye"></use>
                <circle id="eyef" className="eye" clipPath="url(#white-clip)" fill="#000" stroke="#2aa7cc" strokeWidth="2" strokeMiterlimit="10" cx="130" cy="65" r="11" />
<ellipse id="white-eye" fill="#2b2b2b" cx="130" cy="40" rx="18" ry="12" />
              </g>
              <circle className="lightblue" cx="105" cy="32" r="2.5" id="tornillo" />
              <use xlinkHref="#tornillo" x="50"></use>
              <use xlinkHref="#tornillo" x="50" y="60"></use>
              <use xlinkHref="#tornillo" y="60"></use>
            </g>
          </svg>
<h1>You are not allowed to enter here</h1>
<h1>You are BANNED</h1>
<h2 className="link"onClick={onDisconnection}>Go Home!</h2>
<br></br>
<p style={{color:"black"}}>credit to <a className="link" href="https://codepen.io/marianab/pen/EedpEb">marianab codepen</a></p>
	</Container>
	)
}