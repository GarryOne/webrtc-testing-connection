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
            // {
            //     urls: 'turn:your.turnserver.com:3478',  // TURN server
            //     username: 'turn_username',
            //     credential: 'turn_credential'
            // }
        ]
    });
}

async function setupConnection(peerConnection) {

    // Create an offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);


    const answer = await negotiate(peerConnection);
    await peerConnection.setRemoteDescription(answer);

    return new Promise((resolve, reject) => {

        peerConnection.addEventListener('track', function(evt) {
            console.log('track received', {evt})
            if (evt.track.kind == 'video') {
                document.getElementById('video').srcObject = evt.streams[0];
            } else {
                document.getElementById('audio').srcObject = evt.streams[0];
            }
        });

        peerConnection.oniceconnectionstatechange = () => {
            console.log({a: peerConnection.iceConnectionState})
            if (peerConnection.iceConnectionState === 'connected') {
                resolve();
            } else if (['failed', 'disconnected', 'closed'].includes(peerConnection.iceConnectionState)) {
                reject(new Error('Connection failed'));
            }
        };
    });
}



// other example

async function negotiate(pc) {
    try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // wait for ICE gathering to complete
        await new Promise((resolve) => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                const checkState = () => {
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                };
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });

        const response = await fetch('http://localhost:8080/offer', {
            body: JSON.stringify({
                sdp: pc.localDescription.sdp,
                type: pc.localDescription.type,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });

        const answer = await response.json();

        return answer;
    } catch (e) {
        alert(`Error during negotiation: ${e}`);
        throw e; // Rethrow the error if you need to handle it later
    }
}
