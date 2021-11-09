# Headless Playlist Player

A headless library to play songs sequentially. "Headless" because it's only JS. You _have_ to build your own graphics.

## How to start

First of all, clone the repo:

```
git@github.com:musikele/js-headless-playlist-player.git
cd js-headless-playlist-player
```

To _test_ the library I've prepared a test page. The following command will open a test web page with a player implemented in file `index.html`:

```bash
$ npm run start
```

Once you're happy with the test, and you want to use this library in your next project, you have to run:

```bash
$ npm run build
```

Then import the file in `dist/bundle.js` in your page:

```html
...
<script src="dist/bundle.js"></script>
...
```

And then you can use this library by calling the methods of the global object `PlaylistPlayer`:

```javascript
// add songs to the library.
// The only mandatory attribute is `url`. But you can also pass names or other
// info you may need to build your player.
PlaylistPlayer.load([{ url: 'firstsong.mp3' }, { url: 'secondsong.wav' }]);

// starts playing songs sequentially
PlaylistPlayer.play();

// pauses the song; it can later be resumed by calling `.play()`.
PlaylistPlayer.pause();

// will stop and go to the start of the *current* song.
PlaylistPlayer.stop();

// go to next song if present
PlaylistPlayer.next();

// go to prev song if present
PlaylistPlayer.prev();

// returns the current song list
PlaylistPlayer.getSongsList();

// get current playing song index
PlaylistPlayer.getCurrentSongIndex();

// get player state
PlaylistPlayer.getCurrentState();
// output: [
//    'unloaded', // when no song has been loaded.
//    'stopped', // songs are loaded but no song is playing. If you press play song will start from start.
//    'playing', // music coming out of the speakers!
//    'paused'  // song is paused; if you press play it will resume from last paused location.
// ]

// To listen for changes in the PlaylistPlayer state changes, you can
// attach a listener to 'playlistEvent' event:
document.addEventListener('playlistEvent', (evt) => {
    console.log(evt.detail);
    // {
    //   currentState: "playing",
    //   songs: [...],
    //   currentSongIndex: 2
    // }
});


// to know the current time of the song: 
document.addEventListener('playlistEventTimeUpdate', (evt) => {
    console.log(evt.detail.currentTime) // returns the number of seconds starting from 0
})


// is song in playlist? pass an object with url set 
PlaylistPlayer.isSongInPlaylist({url: "./freejazz.wav"}) // true

// go to last song of the playlist
PlaylistPlayer.goToLastSong();

// go to a song of the playlist
// index must be between zero and playlist length 
PlaylistPlayer.goToSong(3); 
```
