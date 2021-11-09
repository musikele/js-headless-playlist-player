import { PlaylistContext } from './config';
export type EventType = {
    value: string;
    context: Omit<PlaylistContext, 'audio'> &
        Omit<PlaylistContext, 'currentTimeInThisAudio'>;
};

export const sendEvent = (state: EventType): void => {
    const event = new CustomEvent('playlistEvent', {
        detail: {
            currentState: state.value,
            songs: state.context.songs,
            currentSongIndex: state.context.currentSongIndex,
        },
    });
    document.dispatchEvent(event);
};

export const updateTime = (timeEvent: { currentTime: number }): void => {
    const event = new CustomEvent('playlistEventTimeUpdate', {
        detail: {
            currentTime: timeEvent.currentTime,
        },
    });
    document.dispatchEvent(event);
};