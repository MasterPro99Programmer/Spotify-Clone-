const viewportHeight = window.innerHeight;
const calculatedHeight = Math.floor(viewportHeight * 0.86);
const leftPanel = document.querySelector('.left');
const rightPanel = document.querySelector('.right');
const homePanel = document.querySelector('.homePage');
const hamburgerIcon = document.getElementById('hamburgerIcon')

window.onload = function () {
    // Check if the value exists in localStorage
    if (localStorage.getItem('height')) {
        leftPanel.style.height = `${localStorage.getItem('height')}px`;
        rightPanel.style.height = `${localStorage.getItem('height')}px`;
        homePanel.style.height = `${localStorage.getItem('height') - 20}px`
        // localStorage.removeItem('height')
    } else {
        // If the value doesn't exist, store it
        localStorage.setItem('height', calculatedHeight);
        console.log("Value stored in localStorage:", localStorage.getItem('height'));
    }
};




console.log("88% of viewport height in px:", calculatedHeight);

let currentAudio = new Audio();
let audioListElement = document.getElementsByTagName("ul")[0];
const baseUrl = window.location.origin;

let audioTitles = [];
let audioUrls = [];
const domParser = new DOMParser();

async function fetchFolders() {
    const folderResponse = await fetch(`${baseUrl}/audios`);
    const folderHtml = await folderResponse.text();

    const folderLinks = Array.from(
        domParser
            .parseFromString(folderHtml, 'text/html')
            .getElementsByTagName('a')
    ).map(element => {
        if (!element.href.startsWith('.')) {
            return element.href.split("/").slice(-2, -1)[0];
        }
    }).filter(Boolean);

    folderLinks.shift(); // Remove the parent folder link
    console.log(folderLinks);
    await processFolders(folderLinks);
}

async function fetchAudioUrls(folderName) {
    const audioResponse = await fetch(`${baseUrl}/audios/${folderName}`);
    const audioHtml = await audioResponse.text();

    audioTitles = Array.from(
        domParser
            .parseFromString(audioHtml, 'text/html')
            .getElementsByTagName('a')
    )
        .filter(element => element.href.endsWith('.mp3'))
        .map(element => element.textContent.replace('mp3', ''));

    audioUrls = Array.from(
        domParser
            .parseFromString(audioHtml, 'text/html')
            .getElementsByTagName('a')
    )
        .filter(element => element.href.endsWith('.mp3'))
        .map(element => element.href);

    return audioTitles.length;
}

async function processFolders(folders) {
    for (const folderName of folders) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'Card';
        rightPanel.appendChild(cardDiv);

        cardDiv.addEventListener('click', async () => {
            audioListElement.innerHTML = '';
            await fetchAudioUrls(folderName);
            await renderAudioList();

            currentAudio.pause();
            currentAudio = new Audio();
            leftPanel.style.translate = '0%'
            console.log('clicked on div');

        });

        cardDiv.innerHTML = `
            <div class="images">
                <div class="img">
                    <img src="/audios/${folderName}/cover.png">
                </div>
                <div class="playCardButton">
                    <div class="playButton">
                        <img src="/imgs/PlayCard.svg">
                    </div>
                </div>
            </div>
            <div class="names">
                <h4 class="Title">${folderName.replaceAll('%20', ' ').replaceAll('%', ' ')}</h4>
                <p class="subName">${await fetchAudioUrls(folderName)} Tracks</p>
            </div>`;
    }
}

const globalPlayIcon = document.getElementById('play');
function togglePlayback(audioElement, playIcon) {
    if (audioElement.paused) {
        audioElement.play();
        playIcon.src = '/imgs/stop.svg';
        globalPlayIcon.src = '/imgs/stop.svg';
        console.log("Audio is playing");

    } else {
        audioElement.pause();
        playIcon.src = '/imgs/play.svg';
        globalPlayIcon.src = '/imgs/play.svg';
        console.log("Audio is paused");
    }
}

async function renderAudioList() {
    for (let index = 0; index < audioTitles.length; index++) {
        const listItem = document.createElement('li');

        listItem.innerHTML = `
            <div class="playCard">
                <div class="playLogo"><img src="/imgs/musicLogo.svg"></div>
                <div class="info">
                    <div class="playName">${audioTitles[index]}</div>
                    <div class="playIcon"><img src="/imgs/play.svg"></div>
                </div>
            </div>
        `;

        audioListElement.appendChild(listItem);

        const playIcon = listItem.querySelector('.playIcon img');

        listItem.addEventListener('click', () => {
            if (currentAudio.src !== audioUrls[index]) {
                // Stop previous audio
                if (!currentAudio.paused) {
                    currentAudio.pause();
                }
                document.querySelectorAll('.playIcon img').forEach(icon => {
                    icon.src = '/imgs/play.svg';
                });

                // Set new audio
                currentAudio = new Audio(audioUrls[index]);
            }
            togglePlayback(currentAudio, playIcon);

            // Update seekbar
            currentAudio.addEventListener('timeupdate', () => {
                const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                document.getElementById('circle').style.width = `${progress}%`;

                if (!isNaN(currentAudio.duration)) {
                    let currentValue = processDuration(currentAudio.currentTime)
                    let currentduration = processDuration(currentAudio.duration)
                    document.getElementById('audioTime').innerHTML = `<h3>${currentValue} / ${currentduration}</h3>`;
                    document.getElementById('audioName').innerHTML = `<h2>${audioTitles[index]}</h2>`;
                }

                currentAudio.addEventListener('ended', () => {
                    playIcon.src = '/imgs/play.svg';
                    globalPlayIcon.src = '/imgs/play.svg';
                })
            });

            const seekbar = document.getElementById('seekbar');
            seekbar.addEventListener('click', (event) => {
                const clickPosition = event.offsetX;
                const newTime = (clickPosition / seekbar.offsetWidth) * currentAudio.duration;
                currentAudio.currentTime = newTime;
            });

            logicButtons()
        });
    }
}

async function logicButtons() {
    let Index = audioUrls.indexOf(currentAudio.src)


    // Play/Pause button
    document.getElementById('play').onclick = () => {
        let getNextlist = audioListElement.getElementsByTagName('li')[Index];
        let playIcon = getNextlist.getElementsByTagName('img')[1]
        if (!currentAudio.paused) {
            currentAudio.pause();
            document.getElementById('play').src = '/imgs/play.svg';
            playIcon.src = '/imgs/play.svg';
            console.log('Audio Pause');
        } else {
            currentAudio.play();
            document.getElementById('play').src = '/imgs/stop.svg';
            playIcon.src = '/imgs/stop.svg';
            console.log('Audio Playing');
        }

    };


    document.getElementById('next').onclick = () => {
        if (Index + 1 < audioUrls.length) {
            let getNextlist = audioListElement.getElementsByTagName('li')[Index];
            let playIcon = getNextlist.getElementsByTagName('img')[1];

            // Reset previous play icon
            playIcon.src = '/imgs/stop.svg';

            Index += 1; // Move to the next track

            // Pause the current audio and play the next one
            currentAudio.pause();
            console.log('Audio Pause');
            currentAudio.src = audioUrls[Index];
            currentAudio.play();

            // Update the play icon to stop
            playIcon.src = '/imgs/play.svg';
            globalPlayIcon.src = '/imgs/stop.svg';
            document.getElementsByTagName('li')[Index].getElementsByTagName('img')[1].src = '/imgs/stop.svg';
            console.log('Audio Playing');
        } else {
            // Reset to the first track

            let getNextlist = audioListElement.getElementsByTagName('li')[Index];
            let playIcon = getNextlist.getElementsByTagName('img')[1];

            // Reset previous play icon
            playIcon.src = '/imgs/stop.svg';

            Index = 0;  // Reset index to 0 when reaching the end

            // Pause and reset audio
            currentAudio.pause();
            console.log('Audio Pause');
            currentAudio.src = audioUrls[0];

            // Play the first track
            currentAudio.play();
            playIcon.src = '/imgs/play.svg';
            globalPlayIcon.src = '/imgs/stop.svg';
            document.getElementsByTagName('li')[Index].getElementsByTagName('img')[1].src = '/imgs/stop.svg';
            console.log('Audio Playing');
        }
    };

    document.getElementById('previous').onclick = () => {
        if (Index - 1 > 0) {
            let getNextlist = audioListElement.getElementsByTagName('li')[Index];
            let playIcon = getNextlist.getElementsByTagName('img')[1];

            // Reset previous play icon
            playIcon.src = '/imgs/stop.svg';

            Index -= 1; // Move to the next track

            // Pause the current audio and play the next one
            currentAudio.pause();
            console.log('Audio Pause');
            currentAudio.src = audioUrls[Index];
            currentAudio.play();

            // Update the play icon to stop
            playIcon.src = '/imgs/play.svg';
            globalPlayIcon.src = '/imgs/stop.svg';
            document.getElementsByTagName('li')[Index].getElementsByTagName('img')[1].src = '/imgs/stop.svg';
            console.log('Audio Playing');
        } else {
            // Reset to the first track

            let getNextlist = audioListElement.getElementsByTagName('li')[Index];
            let playIcon = getNextlist.getElementsByTagName('img')[1];

            // Reset previous play icon
            playIcon.src = '/imgs/stop.svg';

            Index = 0;  // Reset index to 0 when reaching the end

            // Pause and reset audio
            currentAudio.pause();
            console.log('Audio Pause');
            currentAudio.src = audioUrls[0];

            // Play the first track
            currentAudio.play();
            playIcon.src = '/imgs/play.svg';
            globalPlayIcon.src = '/imgs/stop.svg';
            document.getElementsByTagName('li')[Index].getElementsByTagName('img')[1].src = '/imgs/stop.svg';
            console.log('Audio Playing');
        }
    };

}

function processDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}





async function main() {
    await fetchFolders();

    hamburgerIcon.onclick = () => {
        leftPanel.style.translate = '0%'
        console.log('clicked1');
    }

    let closeLeftpanel = document.getElementsByClassName('close')[0]
    closeLeftpanel.onclick = () => {
        leftPanel.style.translate = '-200%'
        console.log('clicked2');
    }

    document.body.addEventListener('')
}

main();
