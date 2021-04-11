export const MachineConfig = {
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
          actions: ['play']
        },
      },
    },
    playing: {
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

export const MachineEvents = {
  actions: {
    addSongs: (context: any, event: any) => {
      console.log('added songs: ', event.songs);
      context.songs.push(...event.songs);
    },
    play: (context: any, event: any) => {
        console.log(context.songs[0])
      const audio = new Audio(context.songs[0]);
      audio.play();
    },
  },
  guards: {
    songsAreValid: (context: any, event: any): boolean => {
      return event.songs && event.songs.length;
    },
  },
};
