document.getElementById('testLocal').addEventListener('click', async () => {
    const peerConnection = createPeerConnection();
    try {
        await setupConnection(peerConnection);
        displayResult('Local connection test successful.');
    } catch (error) {
        displayResult('Local connection test failed.');
    }
});

document.getElementById('testSTUN').addEventListener('click', async () => {
    const peerConnection = createPeerConnection();
    try {
        await setupConnection(peerConnection);
        displayResult('STUN connection test successful.');
    } catch (error) {
        displayResult('STUN connection test failed.');
    }
});

document.getElementById('testTURN').addEventListener('click', async () => {
    const peerConnection = createPeerConnection();
    try {
        await setupConnection(peerConnection);
        displayResult('TURN connection test successful.');
    } catch (error) {
        displayResult('TURN connection test failed.');
    }
});

function displayResult(message) {
    const resultsElement = document.getElementById('results');
    resultsElement.textContent = message;
}

function createPeerConnection() {
    return new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // STUN server
            {
                urls: 'turn:your.turnserver.com:3478',  // TURN server
                username: 'turn_username',
                credential: 'turn_credential'
            }
        ]
    });
}

async function sendOffer(offer) {
    console.log('sendOffer')
    const response = await fetch('http://localhost:8080/offer', {
        method: 'POST',
        body: JSON.stringify(offer),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const answer = await response.json();
    return answer;
}

async function setupConnection(peerConnection) {
    console.log('setupConnection');

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer to the simulated peer and get the answer
    const answer = await sendOffer({
        sdp: peerConnection.localDescription.sdp,
        type: peerConnection.localDescription.type
    });

    // Set the remote description with the answer from the simulated peer
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    return new Promise((resolve, reject) => {
        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'connected') {
                resolve();
            } else if (['failed', 'disconnected', 'closed'].includes(peerConnection.iceConnectionState)) {
                reject(new Error('Connection failed'));
            }
        };
    });
}
