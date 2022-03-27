import {useEffect, useState} from "react"
import useStore  from '../../hooks/useStore'

const BonusHandler:React.VFC<{}> = () => {
	const [frame, setFrame] = useState<number>(0);
	const leftUp = useStore(s => s.BonusLeft.y);
	const rightUp = useStore(s => s.BonusRight.y);
	useEffect(() => {
		const timer = setTimeout(() => {
			if (leftUp >= 0 || rightUp >= 0) {
				setFrame(f => f + 1);
				useStore.setState(s => ({...s, radius: s.radius + (Math.floor(frame / 10) % 2 === 0 ? 2 : -2 )}));
			}
			else if (frame) {
				setFrame(0);
			}
		}, 100); // changer cette valeur permet de render + ou - vite

		return () => clearTimeout(timer);
	});

	return null;
}

export default BonusHandler