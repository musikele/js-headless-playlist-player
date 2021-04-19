import { Machine, interpret} from 'xstate';
import {MachineConfig, MachineEvents} from './config';

const playerMachine = Machine(MachineConfig, MachineEvents); 

export const playerInterpret = interpret(playerMachine)
    .onTransition(state => console.log(state.value))
    .start();

export const play = ():void => {
    playerInterpret.send('PLAY')
}

export const stop = (): void => {
    playerInterpret.send('STOP')
}

export const pause = (): void => {
    playerInterpret.send('PAUSE')
}

export const addSongs = (songs: []): void => {
    playerInterpret.send('LOAD', {songs})
}