export interface PlaylistContext {
    songs: string[];
    currentSongIndex: number;
}

export interface PlaylistSchema {
    states: {
        unloaded: Record<string, unknown>;
        stopped: Record<string, unknown>;
        playing: Record<string, unknown>;
        paused: Record<string, unknown>;
        movedToNextSong: Record<string, unknown>;
        movedToPreviousSong: Record<string, unknown>;
        songAdded: Record<string, unknown>;
        songRemoved: Record<string, unknown>;
    };
}
export type LoadEvent = { type: 'LOAD'; songs: string[] };

export type PlaylistEvent =
    | LoadEvent
    | { type: 'PLAY' }
    | { type: 'STOP' }
    | { type: 'PAUSE' };

