import { Machine, interpret } from 'xstate';
import { myMachineConfig, MachineEvents } from './config';

const playerMachine = Machine(myMachineConfig, MachineEvents);

export const playerInterpret = interpret(playerMachine)
    .onTransition((state) => {
        console.log(state.value);
        console.log(state.context);
        const event = new CustomEvent('playlistEvent', {
            detail: {
                currentState: state.value,
                songs: state.context.songs,
                currentSongIndex: state.context.currentSongIndex,
            },
        });
        document.dispatchEvent(event);
    })
    .start();

export const play = (): void => {
    playerInterpret.send('PLAY');
};

export const stop = (): void => {
    playerInterpret.send('STOP');
};

export const pause = (): void => {
    playerInterpret.send('PAUSE');
};

export const next = (): void => {
    const nextSong = playerInterpret.machine.context.currentSongIndex + 1;
    playerInterpret.send('GO_TO_SONG', { nextSong });
};

export const prev = (): void => {
    const nextSong = playerInterpret.machine.context.currentSongIndex - 1;
    playerInterpret.send('GO_TO_SONG', { nextSong });
};

export const addSongs = (songs: []): void => {
    playerInterpret.send('LOAD', { songs });
};

export const getSongsList = (): string[] => {
    return playerInterpret.machine.context.songs;
};

export const getCurrentSongIndex = (): number => {
    return playerInterpret.machine.context.currentSongIndex;
};
