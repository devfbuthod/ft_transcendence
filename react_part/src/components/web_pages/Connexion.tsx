import { Button, Image } from "react-bootstrap"
import LogoPong from "../pictures/ping-pong.png"
import Logo42 from "../pictures/42-Logo.svg"
import "./connexion.css"

function Connexion () {

    function onConnexion() {
        window.location.href = 'http://' + process.env.REACT_APP_DOMAIN_BACKEND + '/auth/login/';
    }

    return (
		<div className="login shadow-sm">
			<Image className="logo-pong" src={LogoPong} alt="pong logo"/>
			<h1>Pong</h1>
			<Button onClick={onConnexion}>
				Login with <Image className="logo-42" src={Logo42} alt="42" />
			</Button>
			<span className="credits">Codé avec beaucoup de <i style={{color: "pink"}}>♥</i> par <a href="https://profile.intra.42.fr/users/abourbou" title="Arthur Bourbousson">abourbou</a>,{' '}
				<a href="https://profile.intra.42.fr/users/lolopez" title="Lou Lopez">lolopez</a>,{' '}
				<a href="https://profile.intra.42.fr/users/fgalaup" title="Félix Galaup">fgalaup</a>,{' '}
				<a href="https://profile.intra.42.fr/users/yictseng" title="Yiching Tseng">yictseng</a>,{' '}
				<a href="https://profile.intra.42.fr/users/fbuthod-" title="Fabien Buthod Garcon">fbuthod-</a>.
			</span>
		</div>
    );
}

export default Connexion;