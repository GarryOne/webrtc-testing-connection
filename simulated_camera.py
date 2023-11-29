import cv2
import asyncio
import json
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamTrack
from av import VideoFrame
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire application

# Create a thread-local variable to store the event loop for each thread
loop = asyncio.new_event_loop()

class FileVideoStreamTrack(MediaStreamTrack):
    """
    A video stream track that streams a video file as if it's a live camera feed.
    """
    kind = "video"

    def __init__(self, file_path):
        super().__init__()
        self.file_path = file_path
        self.cap = cv2.VideoCapture(file_path)

    async def recv(self):
        """
        A coroutine that yields video frames, simulating a live camera feed.
        """
        ret, frame = self.cap.read()
        if not ret:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Restart the video when it ends
            ret, frame = self.cap.read()

        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = VideoFrame.from_ndarray(frame, format="rgb24")
        frame.pts, frame.time_base = self.cap.get(cv2.CAP_PROP_POS_MSEC), 1 / 1000

        await asyncio.sleep(1/self.cap.get(cv2.CAP_PROP_FPS))  # Control frame rate
        return frame

@app.route('/offer', methods=['POST'])
def on_offer():
    params = request.get_json()

    # Create a new event loop for asynchronous operations
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def handle_offer():
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        pc = RTCPeerConnection()
        pc.addTrack(FileVideoStreamTrack("file_example_MP4_640_3MG.mp4"))

        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

    # Run the asynchronous function and get the result
    response_data = loop.run_until_complete(handle_offer())
    loop.close()

    return jsonify(response_data)
if __name__ == "__main__":
    app.run(host="localhost", port=8080, threaded=True)
