import { useEffect } from 'react';

const pressed:boolean[] = [];
pressed[38] = false;
pressed[40] = false;
pressed[62] = false;
function useKeyPressCB(key:string, action:Function) {	
	useEffect(() => {
		const onKeyDown = (e:KeyboardEvent) => {
			e.preventDefault();
			if (e.key === key) {
				if (!pressed[e.keyCode])
					action(true);
				pressed[e.keyCode] = true;
			}
		}
		
		const onKeyUp = (e:KeyboardEvent) => {
			e.preventDefault();
			if (e.key === key) {
				pressed[e.keyCode] = false;
				action(false);
			}
		  }
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('keydown', onKeyDown);
    return () => {
		window.removeEventListener('keyup', onKeyUp);
		window.removeEventListener('keydown', onKeyDown);
	}
  	}, [key, action]);
}

export default useKeyPressCB