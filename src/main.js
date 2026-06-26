
// Constants
const Constants = {
    TOTAL_GIFS: 113,
    GIF_KEYBORD_SWITCH: 'g',
    PLAY_PAUSE_KEYBORD_SWITCH: ' ',
    PREV_KEYBORD_SWITCH: 'arrowleft',
    NEXT_KEYBORD_SWITCH: 'arrowright'
};

// Player state variables
let player;
let currentStationIndex = 0;
let currentVideoIndex = Math.floor(Math.random() * LofiStations[0].songs.items.length);
let videos = LofiStations[0].songs.items.map(item => item.id.videoId);
let gifChangeTimer = null;

// Load YouTube IFrame API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Initialize YouTube Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtubePlayer', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
        playerVars: {
            'autoplay': 1,
            'mute': 1,
            'controls': 0,
            'showinfo': 0,
            'rel': 0,
            'modestbranding': 1
        }
    });
}

function onPlayerReady(event) {
    // Set initial volume
    const volumeSlider = document.getElementById('volumeSlider');
    player.setVolume(volumeSlider.value);

    // Show play icon initially
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');

    // Update song title
    updateSongTitle();
}

function onPlayerStateChange(event) {
    // When video ends, play next video
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
        randomizeGifWall(); // Change GIF when song changes
    } else if (event.data === YT.PlayerState.PAUSED) {
        // Show play icon when paused
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    } else if (event.data === YT.PlayerState.PLAYING) {
        // Show pause icon when playing
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
}

function updateSongTitle() {
    const songTitle = document.getElementById('songTitle');
    const currentVideo = LofiStations[currentStationIndex].songs.items[currentVideoIndex];
    songTitle.textContent = currentVideo.snippet.title;
}

function playNextVideo() {
    currentVideoIndex = Math.floor(Math.random() * videos.length);
    player.loadVideoById(videos[currentVideoIndex]);
    updateSongTitle();
}

function playPreviousVideo() {
    currentVideoIndex = Math.floor(Math.random() * videos.length);
    player.loadVideoById(videos[currentVideoIndex]);
    updateSongTitle();
}

function togglePlay() {
    const state = player.getPlayerState();
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');

    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    } else {
        player.playVideo();
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
}

function stopVideo() {
    player.stopVideo();
}

/**
 * randomly selects and sets as background cover image for the
 * main container div in the home UI
 * @returns
 */
async function randomizeGifWall() {
    const containerDiv = window.document.querySelector("#mainContainer");

    if (containerDiv === undefined) {
        console.log(`no mainContainer ID found`);
        return;
    }
    const randomNumber = Math.floor(Math.random() * Constants.TOTAL_GIFS) + 1;
    containerDiv.style.backgroundImage = `url('./assets/gifs_${randomNumber}.gif')`;
}

/**
 * Event handler for keyboard press
 * @param {KeyboardEvent} event
 */
async function handleKeyPress(event) {
    // Configure the randomize GIF walls
    if (event.key.toLowerCase() === Constants.GIF_KEYBORD_SWITCH) {
        await randomizeGifWall();
    } else if (event.key.toLowerCase() === Constants.PLAY_PAUSE_KEYBORD_SWITCH) {
        event.preventDefault();
        togglePlay();
    } else if (event.key.toLowerCase() === Constants.PREV_KEYBORD_SWITCH) {
        playPreviousVideo();
        await randomizeGifWall();
    } else if (event.key.toLowerCase() === Constants.NEXT_KEYBORD_SWITCH) {
        playNextVideo();
        await randomizeGifWall();
    }
}

async function main() {
    await randomizeGifWall();

    // Set up 5-minute timer for GIF changes
    gifChangeTimer = setInterval(randomizeGifWall, 5 * 60 * 1000); // 5 minutes in milliseconds

    loadYouTubeAPI();

    // Initialize station UI
    initializeStationUI();

    // Button controls
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', playPreviousVideo);
    document.getElementById('nextBtn').addEventListener('click', playNextVideo);
    document.getElementById('stopBtn').addEventListener('click', stopVideo);

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', (e) => {
        if (player && player.setVolume) {
            player.setVolume(e.target.value);
        }
    });

    // Register keyboard event listener
    window.document.addEventListener('keydown', handleKeyPress);
}

// Initializes the station UI for the feed
function initializeStationUI() {
    const stationsContainer = document.getElementById('stationsContainer');

    LofiStations.forEach((station, index) => {
        const stationCard = document.createElement('div');
        stationCard.className = `station-card ${index === 0 ? 'active' : ''} cursor-pointer p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(236,72,153,0.3)] hover:drop-shadow-[0_0_12px_rgba(236,72,153,0.6)] blur-[0.5px]`;
        stationCard.setAttribute('data-station', index);

        stationCard.innerHTML = `
            <div class="text-center">
                <div class="text-3xl mb-2">${station.icon}</div>
                <div class="text-lg font-medium text-white mb-1">${station.genreType}</div>
                <div class="text-sm text-gray-300">${station.description}</div>
            </div>
        `;

        stationCard.addEventListener('click', () => {
            switchStation(index);
        });

        stationsContainer.appendChild(stationCard);
    });
}

function switchStation(stationIndex) {
    if (stationIndex === currentStationIndex) return;

    currentStationIndex = stationIndex;
    videos = LofiStations[currentStationIndex].songs.items.map(item => item.id.videoId);
    currentVideoIndex = Math.floor(Math.random() * videos.length);
    console.log(LofiStations[currentStationIndex].genreType);

    // Update the player with new video
    if (player && player.loadVideoById) {
        player.loadVideoById(videos[currentVideoIndex]);
    }

    // Update UI to show current station
    updateStationUI();
    updateSongTitle();
}

function updateStationUI() {
    // Remove active class from all station cards
    document.querySelectorAll('.station-card').forEach(card => {
        card.classList.remove('active');
    });

    // Add active class to current station card
    const currentCard = document.querySelector(`[data-station="${currentStationIndex}"]`);
    if (currentCard) {
        currentCard.classList.add('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Execute the script ...
    main().then(() => { }).catch(console.error);
});

