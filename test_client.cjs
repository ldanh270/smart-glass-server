// test_client.cjs - WebSocket Test Client for Smart Glass Server
const WebSocket = require("ws")
const fs = require("fs")
const path = require("path")

// ========================
// CONFIGURATION
// ========================
const PORT = process.env.PORT || 5000
const WS_URL = `ws://localhost:${PORT}/ws`
const FILE_PATH = path.join(__dirname, "test_audio.mp3") // hoặc test_audio.mp3

// Chunk size: lượng dữ liệu gửi mỗi lần (bytes)
const CHUNK_SIZE = 3200 // ~100ms audio ở 16kHz, 16-bit mono
const INTERVAL_MS = 100 // Khoảng cách giữa các chunk (ms)

// ========================
// WEBSOCKET CONNECTION
// ========================
console.log(`\n🔌 Đang kết nối tới: ${WS_URL}`)

const ws = new WebSocket(WS_URL)

// ========================
// EVENT HANDLERS
// ========================

ws.on("open", () => {
    console.log("✅ Đã kết nối tới Server")
    console.log("")

    // Bắt đầu stream audio sau khi kết nối
    startStreaming()
})

ws.on("message", (data, isBinary) => {
    if (isBinary) {
        console.log(`\n📥 Nhận binary: ${data.length} bytes`)
        return
    }

    // Parse JSON message từ server
    try {
        const msg = JSON.parse(data.toString("utf8"))
        const { type, payload } = msg

        switch (type) {
            case "chunk_received":
                // Không log mỗi chunk để tránh spam
                break

            case "stt_partial":
                console.log(payload?.text || "")
                break

            case "stt_flush":
                console.log(payload?.text || "")
                break

            case "stt_error":
                console.error("Error:", payload)
                break

            default:
                console.log(`\n� [${type}]`, payload)
        }
    } catch (e) {
        console.log(`\n📨 Text: ${data.toString("utf8")}`)
    }
})

ws.on("close", (code, reason) => {
    console.log(`\n� Đã ngắt kết nối: ${code} - ${reason?.toString?.() || ""}`)
})

ws.on("error", (err) => {
    console.error(`❌ Lỗi WebSocket:`, err.message)
})

// ========================
// STREAMING FUNCTION
// ========================
function startStreaming() {
    console.log(`📂 File: ${FILE_PATH}`)

    // Kiểm tra file tồn tại
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ Không tìm thấy file: ${FILE_PATH}`)
        ws.close()
        return
    }

    // Đọc file audio
    const fileBuffer = fs.readFileSync(FILE_PATH)
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE)
    let offset = 0
    let chunkCount = 0

    console.log(`📊 Kích thước file: ${(fileBuffer.length / 1024).toFixed(2)} KB`)
    console.log(`📦 Số chunks: ${totalChunks} (mỗi chunk ${CHUNK_SIZE} bytes)`)
    console.log(`⏱️  Interval: ${INTERVAL_MS}ms`)
    console.log(`\n🎙️  Bắt đầu stream audio...\n`)

    const intervalId = setInterval(() => {
        // Kiểm tra kết nối
        if (ws.readyState !== WebSocket.OPEN) {
            clearInterval(intervalId)
            console.log("\n⚠️  WebSocket đã ngắt kết nối, dừng stream")
            return
        }

        // Kiểm tra đã gửi hết file chưa
        if (offset >= fileBuffer.length) {
            clearInterval(intervalId)
            console.log(`\n\n✅ Đã gửi hết ${chunkCount} chunks`)

            // Giữ kết nối thêm để nhận kết quả cuối
            console.log("⏳ Đang chờ kết quả cuối cùng...")
            setTimeout(() => {
                console.log("👋 Đóng kết nối")
                ws.close()
            }, 2000)
            return
        }

        // Cắt chunk từ buffer
        const end = Math.min(offset + CHUNK_SIZE, fileBuffer.length)
        const chunk = fileBuffer.subarray(offset, end)

        // Gửi binary chunk qua WebSocket
        ws.send(chunk)

        chunkCount++
        offset += CHUNK_SIZE
    }, INTERVAL_MS)
}

// ========================
// GRACEFUL SHUTDOWN
// ========================
process.on("SIGINT", () => {
    console.log("\n\n⚠️  Nhận SIGINT, đang đóng kết nối...")
    ws.close()
    process.exit(0)
})

process.on("SIGTERM", () => {
    console.log("\n\n⚠️  Nhận SIGTERM, đang đóng kết nối...")
    ws.close()
    process.exit(0)
})
