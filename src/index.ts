import { Machine, interpret } from 'xstate';
import { myMachineConfig, MachineEvents } from './config';
import type { Song } from './config';
import { sendEvent } from './events';

const playerMachine = Machine(myMachineConfig, MachineEvents);

export const playerInterpret = interpret(playerMachine)
    .onTransition((state) => {
        sendEvent({
            value: state.value as string,
            context: state.context,
        });
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

export const getSongsList = (): Song[] => {
    return playerInterpret.machine.context.songs;
};

export const getCurrentSongIndex = (): number => {
    return playerInterpret.machine.context.currentSongIndex;
};

export const getCurrentState = (): string => {
    return playerInterpret.state.value as string;
}

export const isSongInPlaylist = (song: Song): boolean => {
    if (!song || !song.url) throw new Error('Song must have url property');
    const songList = getSongsList();
    for (const aSong of songList) {
        if (song.url === aSong.url) return true;
    }
    return false;
};

export const goToLastSong = (): void => {
    const nextSong = playerInterpret.machine.context.songs.length - 1;
    playerInterpret.send('GO_TO_SONG', { nextSong });
};

export const goToSong = (index: number): void => {
    if (index < 0 || index > playerInterpret.machine.context.songs.length - 1)
        throw new Error('Index out of bounds');
    playerInterpret.send('GO_TO_SONG', { nextSong: index });
};

export const moveToSecondInCurrentSong = (second: number): void => {
    playerInterpret.send('GO_TO_SECOND', { second });
};

export const setVolume = (volume: number): void => {
    playerInterpret.send('SET_VOLUME', { volume });
};