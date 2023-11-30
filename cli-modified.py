import asyncio
import logging
import json

from quart import current_app
from quart import Quart, jsonify
from flask import Flask, request, jsonify
import cv2
import numpy
from aiortc import RTCPeerConnection, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer, MediaRecorder
from av import VideoFrame


# args = parser.parse_args()
app = Quart(__name__)

class FlagVideoStreamTrack(VideoStreamTrack):
    """
    A video track that returns an animated flag.
    """

    def __init__(self):
        super().__init__()  # don't forget this!
        self.counter = 0
        height, width = 480, 640

        # generate flag
        data_bgr = numpy.hstack(
            [
                self._create_rectangle(
                    width=213, height=480, color=(255, 0, 0)
                ),  # blue
                self._create_rectangle(
                    width=214, height=480, color=(255, 255, 255)
                ),  # white
                self._create_rectangle(width=213, height=480, color=(0, 0, 255)),  # red
            ]
        )

        # shrink and center it
        M = numpy.float32([[0.5, 0, width / 4], [0, 0.5, height / 4]])
        data_bgr = cv2.warpAffine(data_bgr, M, (width, height))

        # compute animation
        omega = 2 * math.pi / height
        id_x = numpy.tile(numpy.array(range(width), dtype=numpy.float32), (height, 1))
        id_y = numpy.tile(
            numpy.array(range(height), dtype=numpy.float32), (width, 1)
        ).transpose()

        self.frames = []
        for k in range(30):
            phase = 2 * k * math.pi / 30
            map_x = id_x + 10 * numpy.cos(omega * id_x + phase)
            map_y = id_y + 10 * numpy.sin(omega * id_x + phase)
            self.frames.append(
                VideoFrame.from_ndarray(
                    cv2.remap(data_bgr, map_x, map_y, cv2.INTER_LINEAR), format="bgr24"
                )
            )

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        frame = self.frames[self.counter % 30]
        frame.pts = pts
        frame.time_base = time_base
        self.counter += 1
        return frame

    def _create_rectangle(self, width, height, color):
        data_bgr = numpy.zeros((height, width, 3), numpy.uint8)
        data_bgr[:, :] = color
        return data_bgr

async def run(pc, player):
    @pc.on("track")
    def on_track(track):
        print("Receiving %s" % track.kind)
        if track.kind == "video":
            pc.addTrack(FlagVideoStreamTrack())

    # create offer
    await pc.setLocalDescription(await pc.createOffer())
    offer = pc.localDescription

    return offer

async def create_offer():
    # Manually push the application context
    app_context = current_app.app_context()
    app_context.push()

    try:
        pc = RTCPeerConnection()
        player = MediaPlayer("file_example_MP4_640_3MG.mp4")

        # Add a video track
        if player and player.video:
            pc.addTrack(player.video)
        else:
            pc.addTrack(FlagVideoStreamTrack())

        await pc.setLocalDescription(await pc.createOffer())
        return pc.localDescription
    finally:
        # Pop the application context when done
        app_context.pop()

@app.route('/offer', methods=['GET'])
async def get_offer():
    offer = await create_offer()
    return jsonify({'sdp': offer.sdp, 'type': offer.type})


if __name__ == "__main__":
    app.run(port=8000)
