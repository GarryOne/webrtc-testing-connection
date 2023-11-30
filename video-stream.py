import asyncio
import json
import cv2
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription, VideoFrame
from aiohttp import web

pcs = set()

class VideoCameraTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, video_path):
        super().__init__()  # Initialize base MediaStreamTrack
        self.cap = cv2.VideoCapture(video_path)

    async def recv(self):
        # Read frame from video
        ret, frame = self.cap.read()
        if not ret:
            # Restart video if at end
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self.cap.read()

        # Convert to right color format for aiortc
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Create aiortc VideoFrame
        return VideoFrame.from_ndarray(frame, format="rgb24")

async def index(request):
    content = open("index.html", "r").read()
    return web.Response(content_type="text/html", text=content)

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        if pc.iceConnectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    # Add the video track
    pc.addTrack(VideoCameraTrack('file_example_MP4_640_3MG.mp4'))  # Use your video file path

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
    )

async def on_shutdown(app):
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

app = web.Application()
app.on_shutdown.append(on_shutdown)
app.router.add_get("/", index)
app.router.add_post("/offer", offer)

if __name__ == "__main__":
    web.run_app(app, port=3000)
