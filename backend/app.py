from flask import Flask, request, jsonify
from utils.action_extractor import extract_action_points
import whisper
import os

app = Flask(_name_)
model = whisper.load_model("base")

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    file.save("output.wav")

    result = model.transcribe("output.wav")
    transcript = result["text"]
    actions = extract_action_points(transcript)

    return jsonify({
        'transcript': transcript,
        'action_points': actions
    })

if _name_ == '_main_':
    app.run(debug=True)