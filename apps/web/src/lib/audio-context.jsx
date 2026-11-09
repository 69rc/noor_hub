import { createContext, useContext } from 'react';
import { useRecitation } from './audio.jsx';
const AudioContext = createContext(null);
export function AudioProvider({ children }) { const player = useRecitation(); return <AudioContext.Provider value={player}>{children}</AudioContext.Provider>; }
export const useAudio = () => useContext(AudioContext);