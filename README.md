# shareshare

A work-in-progress, mostly serverless, WebRTC application for sending messages, files, and streaming media.


## Why?

WebRTC is pretty great. It allows two devices to connect over the Internet without needing much (if any) operational
infrastructure.

This aims to be a lightweight, easy-to-use web application to allow two devices to connect directly with each other to
transmit data with minimal operational overhead.


## How it works

In order for a WebRTC connection to be established, the following things must occur:

1. The "caller" peer needs to give an
   [**offer**](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer) and a list of [**ICE
   Candidates**](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate) (which describe the caller's network
   environment) to the "callee" peer.
    * A [STUN service](https://datatracker.ietf.org/doc/html/rfc5389) should be used to let the "caller" peer know their
      public IP address & port number
2. Once the "callee" peer receives the **offer**, it must give an
   [**answer**](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer) and a list of **ICE
   Candidates** back to the "caller" peer.
3. Once both "caller" and "callee" have exchanged **offer**/**answer** and **ICE Candidates**, they can use the **ICE
   Candidates** to attempt to establish a bidirectional, encrypted data channel.

This application encodes the **offer** and **ICE Candidates** as a base64-encoded-JSON blob appended to the invitation
URL, which handles step (1). The response token is another base64-encoded-JSON blob, which handles step (2). Once
received, step (3) is handled by the web browsers. 

Discovering **ICE Candidates** may take a surprisingly long time. The WebRTC specification suggests using a "signaling
server" to both send the offer/answer and stream these ICE Candidates as they are discovered. This application does not
use a signaling server, and instead uses this base64-encoded-json-blob passing mechanism.

Once the bidirectional data channel is established, it can be used to _renegotiate_ the connection, which is needed if
either peer wants to stream media over WebRTC. 


## Local development

A self-signed certificate is required, `localhost.key` and `localhost.crt` is provided for convenience, it was built
via:

    openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -sha256 -days 3650 -nodes -subj "/C=US/ST=NewYork/L=Brooklyn/O=Me/OU=Me/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

1. Install [nvm](https://github.com/nvm-sh/nvm)
2. Install [jo](https://github.com/jpmens/jo)
3. Run `s/server` to start a local development server
