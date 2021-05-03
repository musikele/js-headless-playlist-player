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

export interface PlaylistSchema {
    states: {
        unloaded: StateSchema;
        stopped: StateSchema;
        playing: StateSchema;
        paused: StateSchema;
    };
}

/**
 * this is the config object for the Playlist xstate machine.
 */
export const myMachineConfig: MachineConfig<
    PlaylistContext,
    PlaylistSchema,
    PlaylistEvent
> = {
    id: 'playlistPlayer',
    // Initial context for the xstate machine
    context: {
        // The array of songs in the playlist. They must have an `url` property.
        songs: [],
        // The song that is currently playing.
        currentSongIndex: 0,
        // the Audio object that will be used to play songs
        audio: new Audio(),
        // the current time of the current song. Updated on pause.
        currentTimeInThisAudio: 0,
    },
    // initial state
    initial: 'unloaded',
    states: {
        // When the State Machine is started but no song has been loaded, the
        // machine will be in this state.
        unloaded: {
            on: {
                LOAD: {
                    target: 'stopped',
                    actions: ['setSongs'],
                    cond: 'songsAreValid',
                },
            },
        },
        // Songs have been loaded but no sound is playing.
        stopped: {
            on: {
                PLAY: {
                    target: 'playing',
                },
            },
        },
        // we're n this state if a song is being played.
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
        // when "paused" songs are not playing but the machine will also remember at what second we are.
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
    // we can move to new songs if we are stopped, playing or paused.
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
        /**
         * all songs coming from the event are added to the current playlist.
         */
        setSongs: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as LoadEvent;
            console.log('added songs: ', event.songs);
            context.songs = event.songs;
        },
        /**
         * If a user explicitly press pause, the machine will remember the currentTime of the current song.
         * @param context
         */
        pause: (context: PlaylistContext): void => {
            if (!context.audio.paused) {
                context.currentTimeInThisAudio = context.audio.currentTime;
            }
        },
        /**
         *
         * @param context
         */
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
