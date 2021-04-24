import { MachineConfig, MachineOptions } from 'xstate';
import { LoadEvent, PlaylistContext, PlaylistEvent } from './interfaces';

export const myMachineConfig: MachineConfig<
    PlaylistContext,
    any,
    PlaylistEvent
> = {
    id: 'playlistPlayer',
    context: {
        songs: [],
        currentSongIndex: 0,
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
            activities: ['play'],
            on: {
                PAUSE: {
                    target: 'paused',
                },
                STOP: {
                    target: 'stopped',
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
        movedToNextSong: {},
        movedToPreviousSong: {},
        songAdded: {},
        songRemoved: {},
    },
};

export const MachineEvents: MachineOptions<PlaylistContext, PlaylistEvent> = {
    actions: {
        addSongs: (context: PlaylistContext, event: PlaylistEvent): void => {
            event = event as LoadEvent;
            console.log('added songs: ', event.songs);
            context.songs.push(...event.songs);
        },
    },
    activities: {
        play: (context: PlaylistContext, event: unknown): (() => void) => {
            let { currentSongIndex} = context;
            const { songs} = context;
            const audio = new Audio();
            const endedEventListener = () => {
              currentSongIndex++;
              if (currentSongIndex == songs.length) {
                return;
              }
              audio.src = songs[currentSongIndex];
              audio.play();

              console.log("currentSongIndex: ", currentSongIndex);
              console.log("src: ", songs[currentSongIndex])
            }
            function _play() {
                if (currentSongIndex == songs.length - 1) {
                    console.log(`ended: ${currentSongIndex} - songs: ${songs.length}`);
                    return;
                }
                audio.src = songs[currentSongIndex];
                audio.play();
                audio.addEventListener('ended', endedEventListener);
            }
            _play();
            return audio.pause;
        },
    },
    guards: {
        songsAreValid: (
            context: PlaylistContext,
            event: PlaylistEvent
        ): boolean => {
            event = event as LoadEvent;
            return Boolean(event.songs && event.songs.length);
        },
    },
    services: {},
    delays: {},
};
