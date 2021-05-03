import { MachineConfig, MachineOptions, StateSchema } from 'xstate';
import { sendEvent } from './events';

export interface Song {
    name: string;
    url: string;
}
export interface PlaylistContext {
    songs: Song[];
    currentSongIndex: number;
    audio: HTMLAudioElement;
    currentTimeInThisAudio: number;
}

export const myMachineConfig: MachineConfig<
    PlaylistContext,
    {
        states: {
            unloaded: StateSchema;
            stopped: StateSchema;
            playing: StateSchema;
            paused: StateSchema;
        };
    },
    PlaylistEvent
> = {
    id: 'playlistPlayer',
    context: {
        songs: [],
        currentSongIndex: 0,
        audio: new Audio(),
        currentTimeInThisAudio: 0,
    },
    initial: 'unloaded',
    states: {
        unloaded: {
            on: {
                LOAD: {
                    target: 'stopped',
                    actions: ['addSongs'],
                    cond: 'songsAreValid',
                },
            },
        },
        stopped: {
            on: {
                PLAY: {
                    target: 'playing',
                },
            },
        },
        playing: {
            entry: ['preparePlay'],
            activities: ['play'],
            on: {
                PAUSE: {
                    target: 'paused',
                    actions: ['pause'],
                },
                STOP: {
                    target: 'stopped',
                    actions: ['stop'],
                },
            },
        },
        paused: {
            on: {
                STOP: {
                    target: 'stopped',
                },
                PLAY: {
                    target: 'playing',
                },
            },
        },
    },
    on: {
        GO_TO_SONG: {
            actions: ['goToSong'],
        },
    },
};

export type LoadEvent = { type: 'LOAD'; songs: Song[] };
export type GoToSongEvent = { type: 'GO_TO_SONG'; nextSong: number };

export type PlaylistEvent =
    | LoadEvent
    | GoToSongEvent
    | { type: 'PLAY' }
    | { type: 'STOP' }
    | { type: 'PAUSE' };

export const MachineEvents: MachineOptions<PlaylistContext, PlaylistEvent> = {
    actions: {
        addSongs: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as LoadEvent;
            console.log('added songs: ', event.songs);
            context.songs.push(...event.songs);
        },
        pause: (context: PlaylistContext): void => {
            if (!context.audio.paused) {
                context.currentTimeInThisAudio = context.audio.currentTime;
            }
        },
        stop: (context: PlaylistContext): void => {
            context.currentTimeInThisAudio = 0;
            context.audio.pause();
        },
        goToSong: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as GoToSongEvent;
            const { nextSong } = event;
            if (
                typeof nextSong === 'number' &&
                nextSong >= 0 &&
                nextSong < context.songs.length
            ) {
                context.currentSongIndex = nextSong;
            }
            if (!context.audio.paused) {
                context.audio.pause();
                context.audio.src = context.songs[context.currentSongIndex].url;
                context.audio.play();
            } else {
                context.currentTimeInThisAudio = 0;
                context.audio.currentTime = 0;
            }
        },
        preparePlay: (context: PlaylistContext): void => {
            if (context.currentSongIndex < context.songs.length) {
                context.audio.src = context.songs[context.currentSongIndex].url;
                context.audio.play();
                context.audio.currentTime = context.currentTimeInThisAudio;
            } else {
                context.currentSongIndex = 0;
            }
        },
    },
    activities: {
        play: (context: PlaylistContext): (() => void) => {
            const endedEventListener = () => {
                context.currentSongIndex++;
                if (context.currentSongIndex >= context.songs.length) {
                    return;
                }
                context.audio.src = context.songs[context.currentSongIndex].url;

                sendEvent({
                    value: 'playing',
                    context,
                });
                context.audio.play();
            };

            if (context.currentSongIndex < context.songs.length) {
                context.audio.addEventListener('ended', endedEventListener);
            } else {
                context.currentSongIndex = 0;
                context.audio.removeEventListener('ended', endedEventListener);
            }
            return () => {
                context.audio.pause();
                context.currentTimeInThisAudio = context.audio.currentTime;
                context.audio.removeEventListener('ended', endedEventListener);
            };
        },
    },
    guards: {
        songsAreValid: (
            context: PlaylistContext,
            event: PlaylistEvent
        ): boolean => {
            event = event as LoadEvent;
            if (!Array.isArray(event.songs)) return false;
            if (!event.songs.length) return false;
            for (const song of event.songs) {
                console.error('songs must have "url" parameters');
                if (!song.url) return false;
            }
            return true;
        },
    },
    services: {},
    delays: {},
};
