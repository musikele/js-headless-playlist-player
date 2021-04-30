# Headless Playlist Player

A headless library to play songs sequentially. "Headless" because it's only JS. You _have_ to build your own graphics.

## How to start

First of all, clone the repo:

```
git@github.com:musikele/js-headless-playlist-player.git
cd js-headless-playlist-player
```

To _test_ the library I've prepared a test page. The following command will open a test web page with a player implemented in file `index.html`:

```
npm run start
```

Once you're happy with the test, and you want to use this library in your next project, you have to run:

```
npm run build
```

Then import the file in `dist/bundle.js` in your page:

```
...
<script src="dist/bundle.js"></script>
...
```

And then you can use this library by calling the methods of the global object `PlaylistPlayer`:

```javascript
//  add songs to the library
PlaylistPlayer.load(['firstsong.mp3', 'secondsong.wav']);

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

//returns the current song list
PlaylistPlayer.getSongsList();

//get current playing song index
PlaylistPlayer.getCurrentSongIndex();

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
```
