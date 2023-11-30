## Development mode

Client side
1. Run `npm i -g live-server`
2. Run `live-server public`
3. See the result: https://127.0.0.1:8080

Backend side
1. Have `go` installed (`brew install go`)
2. Run `cd play-from-disk-h264`
3. Run `go run main.go`
4. You'll have the WebRTC server available at: https://127.0.0.1:4000


## Build mode / Production mode
1. Have `Docker` and `Docker compose` installed
2. Run `docker compose up`

## Testing scenarios
Given the `Acceptance Criteria" 
* `Client browser & Camera in same building:`
* `Client browser & Camera in different buildings:`

I understood it like being in the same local network or having some sort of NAT/firewall/proxy between the client and the server. 
For this network scenarios, I left a TODO, but what I've managed to accomplish is trying a connection to a hard-coded URL (Go WebRTC Server) using 3 different ways
* P2P / Local
* STUN
* TURN

Also, I've displayed the logs, the video streaming, and the connection status in the UI

## How I've approached the problem

I need to test connection through WebRTC ... where?
So, one of my initial targets was to build a server that simulates a camera, in order to be able to perform my testing scenarios.

I've tried initially `aiortc` from python ecosystem and didn't work. 
What did work was `pion` package from go. 

I've took the below example and slightly modified the script to turn it from stdin/stdout to a HTTP Server so that I can use from my JS app
https://github.com/pion/example-webrtc-applications/tree/master/play-from-disk-h264

There you can see that I've took a a sample video (`play-from-disk-h264/video.mp4`) 
and running some `ffmpeg` commands I've generated the `output.h264` and `output.ogg` which are used for streaming (simulating a camera stream)


# TODOs

1. Implement Docker compose networks to simulate NAT/Firewalls scenarios
2. Add a form where we'll insert the camera servers (URLs) that we want to test the connection and don't use anymore the hardcoded URL `http://127.0.0.1:4000`
3. Add a form where we'll insert the available TURN/STUN servers/credentials
4. Store the sensitive data encrypted or/and into a database


# Mentions
I did use ChatGPT
