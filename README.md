# Smart Glass Server

Backend server for **Speech-to-Text (STT)** and **real-time translation** for a smart glasses application, built on **Express**, **Socket.IO**, **Picovoice Cheetah**, and the **Groq Chat Completions API**.

---

## 1. Key Features

- Receive **audio streaming** from the client via **Socket.IO**
- Convert speech to text using **Picovoice Cheetah**:
    - Process audio frame by frame
    - Detect sentence boundaries via `isEndpoint`
    - Flush the remaining text in the internal buffer
- Translate the recognized text to a target language (default: **Vietnamese**) using **Groq**
- Stream translation results back to the client in **real time**, chunk by chunk

---

## 2. Architecture & Processing Flow

### High-level Flow

1. Client connects to the server via Socket.IO (`io("http://localhost:PORT")`)
2. Client streams audio chunks through the `voice_stream` event
3. The server uses [`SttService`](src/services/stt.service.ts) to:
    - Accumulate audio frames
    - Call Cheetah to obtain text + `isEndpoint`
4. The server uses [`translateService`](src/services/translate.service.ts) to translate the text
5. The server sends results back to the client via events:
    - `stt_partial`: temporary translation results (for the current chunk)
    - `stt_flush`: remaining translated text at the end of a sentence
    - `stt_error`: on any error

### Main Components

- Entry point: [src/index.ts](src/index.ts)
- Config:
    - Environment variables: [src/configs/env.config.ts](src/configs/env.config.ts) (`CLIENT_URL`, `PORT`, `ACCESS_PASS`, `STT_API_KEY`, `TRANSLATE_API_URL`, `TRANSLATE_MODEL`, `TRANSLATE_API_KEY`)
    - HTTP status: [`HttpStatusCode`](src/configs/response.config.ts)
- Socket & controller:
    - Realtime controller: [`translateController`](src/controllers/translate.controller.ts)
- Services:
    - STT: [`SttService`](src/services/stt.service.ts)
    - Translation: [`translateService`](src/services/translate.service.ts)
- Middleware (currently not attached to routes/sockets):
    - Auth: [`validateDevices`](src/middlewares/auth.middleware.ts)
- Types:
    - Extend `Express.Request`: [src/types/types.d.ts](src/types/types.d.ts)
- Client test:
    - Socket.IO test script: [test_client.cjs](test_client.cjs)

---

## 3. System Requirements

- **Node.js**: >= 18.x
- **Bun**: >= 1.x (used for running dev scripts)
- API accounts / keys:
    - **Picovoice Cheetah** (STT)
    - **Groq** (translation)

---

## 4. Installation

```bash
# Clone project
git clone <your-repo-url>
cd smart-glass-server

# Install dependencies (using Bun)
bun install
```

---

## 5. Environment Configuration

Create a `.env` file in the project root (if it does not exist) with the following structure:

```bash
# URLs
CLIENT_URL=*

# App configs
PORT=5000
PASS=your_access_password

# STT
PICO_VOICE_API_KEY=your_picovoice_access_key

# Translation model
TRANSLATE_MODEL=llama-3.3-70b-versatile

# Groq translation
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_groq_api_key
```

These variables are read in [`env.config.ts`](src/configs/env.config.ts) and used in:

- `CLIENT_URL`, `PORT`, `ACCESS_PASS`: in [src/index.ts](src/index.ts) and [`validateDevices`](src/middlewares/auth.middleware.ts)
- `STT_API_KEY`: in [`SttService`](src/services/stt.service.ts)
- `TRANSLATE_API_URL`, `TRANSLATE_MODEL`, `TRANSLATE_API_KEY`: in [`translateService`](src/services/translate.service.ts)

**Note:** `.env` is ignored by `.gitignore`. Do not commit real keys to the repository.

---

## 6. Running the Application

### Development

```bash
bun dev
```

`dev` script in [package.json](package.json):

```json
"scripts": {
    "dev": "bun --watch src/index.ts"
}
```

The server will run at:

- URL: `http://localhost:5000` (or the port you set in `.env`)

Quick check:

```bash
curl http://localhost:5000/
# -> { "message": "Connect to server successfully" }
```

---

## 7. Communication via Socket.IO

### 7.1. Connection

The server initializes a Socket.IO server in [src/index.ts](src/index.ts):

- Default namespace (`io.on("connection")`)
- CORS:
    - `origin`: `CLIENT_URL` from env
    - `credentials: true`

Client example (using `socket.io-client`):

```js
const io = require("socket.io-client")
const socket = io("http://localhost:5000")
```

---

### 7.2. Events from Client to Server

#### `voice_stream`

- **Direction:** Client -> Server
- **Payload:** Binary audio `Buffer`
- **Handled by:** [`translateController.translate`](src/controllers/translate.controller.ts) + [`SttService`](src/services/stt.service.ts)

Required audio format (per Picovoice Cheetah requirements):

- PCM 16-bit (`Int16Array`)
- Little-endian
- Mono
- Sample rate according to Cheetah’s default configuration (typically $16000$ Hz). Refer to Picovoice documentation to ensure the correct format.

---

### 7.3. Events from Server to Client

#### `stt_partial`

- **When:** The server finishes processing one audio chunk and has new text
- **Payload:**

```json
{
    "text": "Translated content"
}
```

- **Source:** Text from [`SttService`](src/services/stt.service.ts) translated by [`translateService.translate`](src/services/translate.service.ts)

#### `stt_flush`

- **When:** Cheetah identifies an endpoint (`isEndpoint === true`), the server:
    - Calls `service.flush()` in [`SttService`](src/services/stt.service.ts)
    - Translates the remaining text
- **Payload:**

```json
{
    "text": "Remaining translation at the end of the sentence"
}
```

#### `stt_error`

- **When:** Any error occurs during STT or translation
- **Payload:**

```json
{
    "status": 500,
    "message": "Internal server error"
}
```

---

## 8. Sample Test Client

The project includes a test script [test_client.cjs](test_client.cjs) using `socket.io-client`.

### Preparation

1. Place a test audio file (e.g. `test_audio.mp3`) next to `test_client.cjs`
2. Ensure the server is running (`bun dev`)

### Run the client

```bash
node test_client.cjs
```

The script will:

- Connect to `http://localhost:5000`
- Read `test_audio.mp3`
- Split it into chunks of size `CHUNK_SIZE` and send them via the `voice_stream` event
- Listen to:
    - `stt_partial` -> log to console
    - `stt_flush` (if you add a listener) -> log the sentence-ending part
    - `stt_error` -> log errors

---

## 9. Extensions & Future Work

Some possible extensions:

- Attach the [`validateDevices`](src/middlewares/auth.middleware.ts) middleware to:
    - HTTP routes (Express)
    - Or a dedicated auth event over Socket (send `accessCode` before streaming)
- Allow clients to choose the target language:
    - Add a `targetLang` parameter when calling [`translateService.translate`](src/services/translate.service.ts)
- Add more detailed logging:
    - Processing time per chunk
    - End-to-end latency from audio input to translated text
- Support multiple clients / rooms:
    - Create separate [`SttService`](src/services/stt.service.ts) instances per `socket.id` (already prepared in [`translateController`](src/controllers/translate.controller.ts) via a local `service` variable)
- Add automated tests for business logic (decoupled from real external APIs)

---

## 10. License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
