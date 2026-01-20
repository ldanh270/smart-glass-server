// test_client.js
const io = require("socket.io-client")
const fs = require("fs")
const path = require("path")

// 1. Kết nối đến Server
const socket = io("http://localhost:5000") // Thay port của bạn

const FILE_PATH = path.join(__dirname, "test_audio.mp3")
// Chunk size: Lượng dữ liệu gửi mỗi lần.
// 512 bytes tương đương khoảng 16ms âm thanh (với 16kHz 16bit mono)
const CHUNK_SIZE = 1024
const INTERVAL_MS = 50 // Giả lập độ trễ mạng/tốc độ nói

socket.on("connect", () => {
    console.log("- Đã kết nối tới Server:", socket.id)
    startStreaming()
})

socket.on("stt_partial", (data) => {
    console.log(data.text + "\r")
})

socket.on("stt_final", (data) => {
    console.log(data.text)
})

socket.on("stt_error", (err) => {
    console.error("- Lỗi từ Server:", err)
})

socket.on("disconnect", () => {
    console.log("Đã ngắt kết nối")
})

function startStreaming() {
    console.log("- Bắt đầu stream file:", FILE_PATH)

    if (!fs.existsSync(FILE_PATH)) {
        console.error("Không tìm thấy file .pcm! Hãy chạy ffmpeg trước.")
        return
    }

    const fileBuffer = fs.readFileSync(FILE_PATH)
    let offset = 0

    const intervalId = setInterval(() => {
        if (offset >= fileBuffer.length) {
            clearInterval(intervalId)
            console.log("\n- Đã gửi hết file.")
            // Giữ kết nối thêm 1 chút để nhận kết quả cuối rồi đóng
            setTimeout(() => socket.disconnect(), 1000)
            return
        }

        // Cắt 1 miếng buffer
        const end = Math.min(offset + CHUNK_SIZE, fileBuffer.length)
        const chunk = fileBuffer.subarray(offset, end)

        // Gửi lên server
        socket.emit("voice_stream", chunk)

        offset += CHUNK_SIZE
    }, INTERVAL_MS)
}
