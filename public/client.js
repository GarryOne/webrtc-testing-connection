let pc;
let log = msg => {
    document.getElementById('logs').innerHTML += msg + '<br>'
}

function initializeConnection() {
    const connectionType = document.getElementById('connectionType').value;
    let config = {};

    switch (connectionType) {
        case 'stun':
            config.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
            break;
        case 'turn':
            config.iceServers = [
                // Replace with your TURN server configuration
                { urls: 'turn:numb.viagenie.ca', username: 'muazkh', credential: 'webrtc@live.com' },
                {
                    urls: 'turn:192.158.29.39:3478?transport=udp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
            ];
            break;
        case 'p2p':
        default:
            // P2P / local: no ICE servers
            break;
    }

    pc = new RTCPeerConnection(config);

    pc.ontrack = function (event) {
        const videoContainer = document.getElementById('remoteVideos');
        let el = videoContainer.querySelector(event.track.kind);

        if (!el) {
            // If no existing video/audio element is found, create a new one
            el = document.createElement(event.track.kind);
            videoContainer.appendChild(el);
        }

        el.srcObject = event.streams[0];
        el.autoplay = true;
        el.controls = true;
    };

    pc.oniceconnectionstatechange = e => {
        log('ICE Connection State Change: ' + pc.iceConnectionState);
        updateConnectionStatus(pc.iceConnectionState);
    };

    pc.onicecandidate = event => {
        if (event.candidate === null) {
            // document.getElementById('localSessionDescription').value = btoa(JSON.stringify(pc.localDescription));
            sendOffer(pc.localDescription);
        }
    }

    pc.addTransceiver('video', {'direction': 'sendrecv'});
    // pc.addTransceiver('audio', {'direction': 'sendrecv'});

    pc.createOffer().then(d => pc.setLocalDescription(d)).catch(log);
}

function updateConnectionStatus(state) {
    const statusDisplay = document.getElementById('connectionStatus');
    switch (state) {
        case 'connected':
            statusDisplay.textContent = 'Connection successfully established.';
            statusDisplay.style.color = 'green';
            break;
        case 'disconnected':
        case 'failed':
            statusDisplay.textContent = 'Connection failed or disconnected.';
            statusDisplay.style.color = 'red';
            break;
        case 'checking':
            statusDisplay.textContent = 'Connecting...';
            statusDisplay.style.color = 'orange';
            break;
        case 'closed':
            statusDisplay.textContent = 'Connection closed.';
            statusDisplay.style.color = 'gray';
            break;
        default:
            statusDisplay.textContent = 'Connection status: ' + state;
            break;
    }
}


function sendOffer(description) {
    const offer = btoa(JSON.stringify(description));
    const url = `http://localhost:4000/sdp?sdp=${offer}`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.text())
        .then(data => {
            if (data) {
                const _data = JSON.parse(atob(data));
                pc.setRemoteDescription(new RTCSessionDescription(_data))
                    .catch(e => log('Error setting remote description: ' + e.toString()));
            } else {
                log('Invalid SDP data received.');
            }
        })
        .catch(e => log('Error sending offer: ' + e.toString()));
}
