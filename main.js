console.log('Hello World!');
let currentAudio = null;
let currentPlayingLi = null;
let currentSongIndex = 0;
let songsList = [];
let isDragging = false;

const footerSong = document.querySelector(".footer .song");
const footerPlayBtn = document.querySelector(".footer .bi-play-circle-fill, .footer .bi-pause-circle-fill");
const footerDuration = document.querySelector(".footer .duration");
const footerSeek = document.querySelector(".footer .seek");
const footerDot = document.querySelector(".footer .dot");
const leftArrow = document.querySelector(".footer .bi-caret-left");
const rightArrow = document.querySelector(".footer .bi-caret-right");

async function fetchSongs(index = 0) {
  try {
    const res = await fetch("https://raw.githubusercontent.com/officialDangerboy/songs/main/songs.json");
    const allPlaylists = await res.json();
    
    if (!Array.isArray(allPlaylists) || !allPlaylists[index]) {
      console.warn("Playlist not found at index", index);
      return;
    }

    songsList = allPlaylists[index];
    const list = document.querySelector(".playlistcontainer ul");
    list.innerHTML = "";

    songsList.forEach((song, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="songi"><i class="bi bi-music-note"></i></div>
        <div class="songinfo">
          <div class='name'>${song.title}</div>
        </div>
        <div class="songplay">
          <i class="bi bi-play-circle-fill"></i>
        </div>
      `;

      li.addEventListener("click", () => {
        if (currentPlayingLi === li) {
          if (currentAudio.paused) {
            currentAudio.play();
            updateIcon(li, true);
            updateFooterInfo(song.title);
          } else {
            currentAudio.pause();
            updateIcon(li, false);
          }
        } else {
          if (currentAudio) {
            currentAudio.pause();
            updateIcon(currentPlayingLi, false);
          }

          currentPlayingLi = li;
          playSong(idx);
          updateIcon(currentPlayingLi, true);
        }
      });

      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
  }
}

function playSong(index = 0) {
  const song = songsList[index];
  if (!song) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentSongIndex = index;
  currentAudio = new Audio(song.url);
  currentAudio.title = song.title;
  currentAudio.play();

  currentAudio.onloadedmetadata = () => {
    updateFooterInfo(song.title, currentAudio.duration);
  };

  currentAudio.ontimeupdate = () => {
    if (!isDragging) updateSeekBar();
  };

  currentAudio.onended = () => {
    if (currentPlayingLi) updateIcon(currentPlayingLi, false);
    // Play next song with looping back to start if last song finished
    const nextIndex = (currentSongIndex + 1) % songsList.length;
    const listItems = document.querySelectorAll(".playlistcontainer ul li");
    if (listItems[nextIndex]) {
      listItems[nextIndex].click();
    }
  };

  updateFooterInfo(song.title);
  updateIcon(currentPlayingLi, true);
}

function updateIcon(li, isPlaying) {
  if (!li) return;

  const icon = li.querySelector(".songplay i");
  if (icon) {
    icon.classList.remove("bi-play-circle-fill", "bi-pause-circle-fill");
    icon.classList.add(isPlaying ? "bi-pause-circle-fill" : "bi-play-circle-fill");
  }

  if (footerPlayBtn) {
    footerPlayBtn.classList.remove("bi-play-circle-fill", "bi-pause-circle-fill");
    footerPlayBtn.classList.add(isPlaying ? "bi-pause-circle-fill" : "bi-play-circle-fill");
  }
}

function updateFooterInfo(title = "", duration = 0) {
  if (footerSong) footerSong.textContent = title;
  if (footerDuration && currentAudio) {
    footerDuration.textContent = formatTime(currentAudio.currentTime) + " / " + formatTime(currentAudio.duration);
  }
}

function updateSeekBar() {
  if (!footerSeek || !footerDot || !currentAudio) return;
  const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
  footerDot.style.left = `${progress}%`;
  footerDot.style.background = "black";
  updateFooterInfo(currentAudio.title, currentAudio.duration);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

footerPlayBtn?.addEventListener("click", () => {
  if (!currentAudio) return;
  if (currentAudio.paused) {
    currentAudio.play();
    updateIcon(currentPlayingLi, true);
  } else {
    currentAudio.pause();
    updateIcon(currentPlayingLi, false);
  }
});

leftArrow?.addEventListener("click", () => {
  const newIndex = (currentSongIndex - 1 + songsList.length) % songsList.length;
  playSong(newIndex);
});

rightArrow?.addEventListener("click", () => {
  const newIndex = (currentSongIndex + 1) % songsList.length;
  playSong(newIndex);
});

footerSeek?.addEventListener("mousedown", () => { isDragging = true; });
footerSeek?.addEventListener("mouseup", () => { isDragging = false; });

footerSeek?.addEventListener("click", (e) => {
  if (!currentAudio || !footerSeek) return;
  const rect = footerSeek.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const percent = clickX / width;
  currentAudio.currentTime = percent * currentAudio.duration;
  updateSeekBar();
});

footerSeek?.addEventListener("mousemove", (e) => {
  if (isDragging && currentAudio && footerSeek) {
    const rect = footerSeek.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, moveX / width));
    currentAudio.currentTime = percent * currentAudio.duration;
    updateSeekBar();
  }
});

document.querySelector('.close')?.addEventListener('click', () => {
  document.querySelector('.rgt').style.left = '-5000px';
});

Array.from(document.querySelectorAll('.cardcontainer')).forEach((card, index) => {
  card.addEventListener('click', async () => {
    document.querySelector('.rgt').style.left = '0px';
    await fetchSongs(index);

    const list = document.querySelector(".playlistcontainer ul");
    const firstLi = list.querySelector("li");
    if (firstLi) {
      firstLi.click(); // Auto-play first song on playlist load
    }
  });
});

document.querySelector('.ham')?.addEventListener('click', () => {
  document.querySelector('.rgt').style.left = '0px';
});

const volumeIcon = document.querySelector(".vol i");
const volumeSlider = document.querySelector("#vol");

// Set initial volume to 100%
volumeSlider.value = 100;

volumeSlider?.addEventListener("input", () => {
  if (currentAudio) {
    const volume = volumeSlider.value / 100;
    currentAudio.volume = volume;
    updateVolumeIcon(volume);
  }
});

volumeIcon?.addEventListener("click", () => {
  if (!currentAudio) return;

  if (currentAudio.volume > 0) {
    currentAudio.volume = 0;
    volumeSlider.value = 0;
    updateVolumeIcon(0);
  } else {
    currentAudio.volume = 1;
    volumeSlider.value = 100;
    updateVolumeIcon(1);
  }
});

function updateVolumeIcon(volume) {
  if (!volumeIcon) return;
  volumeIcon.classList.remove("bi-volume-up", "bi-volume-mute");
  volumeIcon.classList.add(volume === 0 ? "bi-volume-mute" : "bi-volume-up");
}

fetchSongs();
