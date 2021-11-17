onload = async () => {
    // play single notification
    if (new URL(location.href).searchParams.get('notification') == 1) {
      const ac = new AudioContext();
      const osc = new OscillatorNode(ac);
      osc.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 1);
      await new Promise((resolve) => {
        osc.onended = async () => {
          await ac.close();
          resolve();
        };
      });
      close();
    }
    // https://github.com/GoogleChrome/samples/blob/gh-pages/media-session/audio.js
    let audio = document.createElement('audio');
  
    playAudio();
  
    function playAudio() {
      audio.src = 'alert.mp3';
      audio
        .play()
        .then((_) => updatePositionState())
        .catch((error) => console.log(error));
    }
  
    /* Position state (supported since Chrome 81) */
  
    function updatePositionState() {
      if ('setPositionState' in navigator.mediaSession) {
        console.log('Updating position state...');
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    }
  
    /* Play & Pause */
  
    navigator.mediaSession.setActionHandler('play', async function () {
      console.log('> User clicked "Play" icon.');
      await audio.play();
      // Do something more than just playing audio...
    });
  
    navigator.mediaSession.setActionHandler('pause', function () {
      console.log('> User clicked "Pause" icon.');
      audio.pause();
      // Do something more than just pausing audio...
    });
  
    audio.addEventListener('play', function () {
      navigator.mediaSession.playbackState = 'playing';
    });
  
    audio.addEventListener('pause', function () {
      navigator.mediaSession.playbackState = 'paused';
    });

  };