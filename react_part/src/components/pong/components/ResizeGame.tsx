import useStore from './../hooks/useStore'
import { useMediaQuery } from 'react-responsive'


const ResizeGame:React.FC<{}> = () => {
	const set = useStore.setState;
    const w = useStore(s => s.w);
    const handleSecondStep = (matches:boolean) => {
        if (matches && w !== 700) {
        set(s => ({...s,
            h: 800 *0.75 * 0.9,
            w: 1000 * 0.75,
            scoreBar: {
                ...s.scoreBar,
                h: 800 *0.75 * 0.1,
                w : 1000*0.75,
            }
			}));}
    }
      
    const handleLittle = (matches:boolean) => {
            if (matches && w !== 500) {
                set(s => ({...s,
                h: 800 *0.5 * 0.9,
                w: 1000 * 0.5,
                scoreBar: {
                    ...s.scoreBar,
                    h: 800 *0.5 * 0.1,
                    w : 1000*0.5,
                }
                }))
        ;}
    }

	const handleVeryLittle = (matches:boolean) => {
		if (matches && w !== 400) {
			set(s => ({...s,
			h: 800 *0.4 * 0.9,
			w: 1000 * 0.4,
			scoreBar: {
				...s.scoreBar,
				h: 800 *0.4 * 0.1,
				w : 1000*0.4,
			}
			}))
	;}
}

		const handleFirstStep = (matches:boolean) => {
				if (matches && w!== 1000){
					set(s => ({...s,
						h: 800 * 0.9,
						w: 1000,
						scoreBar: {
							...s.scoreBar,
							h: 800 * 0.1,
							w : 1000,
						}
						}));
				}
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const  firstStep = useMediaQuery(
			{ minWidth: 1636 }, undefined, handleFirstStep
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const secondStep = useMediaQuery(
        { minWidth: 1198, maxWidth:1636 }, undefined,  handleSecondStep
      );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const isDesktopOrLaptop = useMediaQuery(
        { minWidth: 780, maxWidth:1198 }, undefined,  handleLittle
      );
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const veryLittle = useMediaQuery(
			{ maxWidth:780 }, undefined,  handleVeryLittle
		  );
	

return null;}

export default ResizeGame