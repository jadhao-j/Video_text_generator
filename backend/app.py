from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.action_extractor import extract_action_points
import whisper
import os
import subprocess

app = Flask(__name__)
CORS(app)
model = whisper.load_model("base")

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename
    file.save(filename)

    # If the file is a video, extract audio using ffmpeg
    if filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        audio_path = "output.wav"
        subprocess.run([
            "ffmpeg", "-y", "-i", filename, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path
        ], check=True)
    else:
        # Assume it's already an audio file
        audio_path = filename

    result = model.transcribe(audio_path, language="en")
    transcript = result["text"]
    actions = extract_action_points(transcript)

    # Clean up files
    os.remove(filename)
    if audio_path != filename and os.path.exists(audio_path):
        os.remove(audio_path)

    return jsonify({
        'transcript': transcript,
        'action_points': actions
    })

@app.route('/transcribe-chunk', methods=['POST'])
def transcribe_chunk():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = 'chunk.wav'
    file.save(filename)

    result = model.transcribe(filename, language="en")
    transcript = result["text"]

    os.remove(filename)

    return jsonify({'transcript': transcript})

@app.route('/', methods=['GET'])
def home():
    return "Backend is running!"

if __name__ == '__main__':
    app.run(debug=True)


