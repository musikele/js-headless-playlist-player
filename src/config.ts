import { MachineConfig, MachineOptions, StateSchema } from 'xstate';
import { sendEvent, updateTime } from './events';

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
        // when "paused" songs are not playing but the machine will also
        // remember at what second we are.
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
        GO_TO_SECOND: {
            actions: ['goToSecond'],
        },
    },
};

export type LoadEvent = { type: 'LOAD'; songs: Song[] };
export type GoToSongEvent = { type: 'GO_TO_SONG'; nextSong: number };
export type GoToSecondEvent = { type: 'GO_TO_SECOND'; second: number };

export type PlaylistEvent =
    | LoadEvent
    | GoToSongEvent
    | { type: 'PLAY' }
    | { type: 'STOP' }
    | { type: 'PAUSE' }
    | GoToSecondEvent;

export const MachineEvents: MachineOptions<PlaylistContext, PlaylistEvent> = {
    actions: {
        /**
         * all songs coming from the event are added to the current playlist.
         */
        setSongs: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as LoadEvent;
            console.log('loaded new songs: ', event.songs);
            context.songs = event.songs;
        },
        /**
         * If a user explicitly press pause, the machine will remember the
         * currentTime of the current song.
         * @param context
         */
        pause: (context: PlaylistContext): void => {
            if (!context.audio.paused) {
                context.currentTimeInThisAudio = context.audio.currentTime;
            }
        },
        /**
         * The real "stop" action is in the returned function from the play activity.
         * Here, we're only resetting the current time to zero. So next time
         * we hit play it will start from start.
         * @param context
         */
        stop: (context: PlaylistContext): void => {
            context.currentTimeInThisAudio = 0;
            context.audio.pause();
        },
        /**
         * You can go to whatever other song by selecting the index. Remember
         * that it's zero-based.
         * @param context
         * @param event
         */
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
        goToSecond: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as GoToSecondEvent;
            const duration = context.audio.duration;
            const { second } = event;
            if (!second) console.error('cannot move to null second');
            if (second >= 0 && second <= duration) {
                context.audio.currentTime = event.second;
            }
        },

        /**
         * This action is performed before the "play" activity. It will set the
         * current src song.
         * @param context
         */
        preparePlay: (context: PlaylistContext): void => {
            // if the song to play is valid, load the audio and start to play it.
            // then the xstate machine will start the "play" activity to handle
            // exiting from thi state.
            if (context.currentSongIndex < context.songs.length) {
                context.audio.src = context.songs[context.currentSongIndex].url;
                context.audio.play();
                context.audio.currentTime = context.currentTimeInThisAudio;
            } else {
                console.log('preparePlay - else branch');
                // if we reached the end of the
                context.currentSongIndex = 0;
                context.audio.currentTime = 0;
                context.audio.src = context.songs[0].url;
            }
        },
    },
    activities: {
        /**
         * This is a long lasting activity. When the machine enters this
         * state this function will be "long living".
         * When exiting this state, the return function is invoked.
         * @param context
         * @returns
         */
        play: (context: PlaylistContext): (() => void) => {
            /**
             * This function is called when a song ends. If another song is
             * present in the playlist, it will be selected and played.
             * @returns
             */
            const endedEventListener = () => {
                context.currentSongIndex++;
                // If we have reached the end of the playlist, set the current
                // playing song index to the start and send the stopped event.
                if (context.currentSongIndex >= context.songs.length) {
                    context.currentSongIndex = 0;
                    sendEvent({
                        value: 'stopped',
                        context,
                    });
                    return;
                }
                // otherwise, just play the next song
                context.audio.src = context.songs[context.currentSongIndex].url;
                context.audio.play();
                sendEvent({
                    value: 'playing',
                    context,
                });
            };

            // Here's the main body of the "play" activity. If there's another
            //  song to play, add the endedEventListener so next songs can be played.
            if (context.currentSongIndex < context.songs.length) {
                context.audio.addEventListener('timeupdate', () => {
                    updateTime({
                        currentTime: context.audio.currentTime,
                        duration: context.audio.duration,
                    });
                });

                context.audio.addEventListener('ended', endedEventListener);
            } else {
                // If there are no more playable songs, just reset the
                // currentSongIndex and remove the listener.
                context.currentSongIndex = 0;
                context.audio.removeEventListener('ended', endedEventListener);
            }
            // This function is executed when the "playing" state is exited.
            // it will pause audio and save the current time in the song.
            return () => {
                context.audio.pause();
                context.currentTimeInThisAudio = context.audio.currentTime;
                context.audio.removeEventListener('ended', endedEventListener);
            };
        },
    },
    guards: {
        // checks that the songs are valid.
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
