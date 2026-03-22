from flask import Flask, request, jsonify, render_template, send_from_directory
import uuid
import os
import json
import re
import anthropic
from pytube import YouTube

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPT_AVAILABLE = True
except ImportError:
    TRANSCRIPT_AVAILABLE = False

app = Flask(__name__, template_folder="templates")

video_jobs = {}


def extract_video_id(url):
    """Extract YouTube video ID from URL."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_ai_clip_segments(youtube_url, title, description, duration):
    """Use Claude to identify the most interesting clip segments from a video."""
    client = anthropic.Anthropic()

    transcript_text = ""
    if TRANSCRIPT_AVAILABLE:
        video_id = extract_video_id(youtube_url)
        if video_id:
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                transcript_text = "\n".join(
                    f"[{int(e['start'])}s] {e['text']}" for e in transcript
                )
            except Exception:
                pass

    prompt_parts = [f"YouTube Video Analysis\nTitle: {title}"]
    if description:
        prompt_parts.append(f"Description: {description[:500]}")
    if duration:
        prompt_parts.append(f"Duration: {duration} seconds")
    if transcript_text:
        prompt_parts.append(
            f"\nTranscript (with timestamps in seconds):\n{transcript_text[:10000]}"
        )
    else:
        prompt_parts.append(
            "\nNo transcript available. Suggest segments based on typical video structure."
        )

    prompt_parts.append(
        "\nIdentify exactly 3 interesting clip segments to highlight from this video. "
        "Each clip should be 30-90 seconds long. Choose moments that are engaging, "
        "informative, or represent key highlights. Return JSON with start/end times "
        "in seconds and a brief reason explaining why each segment is noteworthy."
    )

    clip_schema = {
        "type": "object",
        "properties": {
            "clips": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "start": {"type": "integer"},
                        "end": {"type": "integer"},
                        "reason": {"type": "string"}
                    },
                    "required": ["start", "end", "reason"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["clips"],
        "additionalProperties": False
    }

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": "\n\n".join(prompt_parts)}],
        output_config={"format": {"type": "json_schema", "schema": clip_schema}}
    ) as stream:
        final = stream.get_final_message()

    text = next(b.text for b in final.content if b.type == "text")
    return json.loads(text)["clips"]


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/upload', methods=['POST'])
def upload():
    data = request.get_json()
    youtube_url = data.get('youtube_url')
    if not youtube_url:
        return jsonify({'error': 'Missing YouTube URL'}), 400

    job_id = str(uuid.uuid4())
    video_jobs[job_id] = {
        'status': 'processing',
        'youtube_url': youtube_url,
        'clips': []
    }

    try:
        yt = YouTube(youtube_url)
        stream = yt.streams.filter(file_extension='mp4').get_highest_resolution()
        video_path = f"videos/{job_id}.mp4"
        os.makedirs("videos", exist_ok=True)
        stream.download(filename=video_path)

        ai_segments = get_ai_clip_segments(
            youtube_url,
            yt.title,
            yt.description,
            yt.length
        )

        output_dir = f"clips/{job_id}"
        os.makedirs(output_dir, exist_ok=True)

        for i, seg in enumerate(ai_segments):
            output_path = f"{output_dir}/clip_{i + 1}.mp4"
            video_jobs[job_id]['clips'].append({
                'clip': output_path,
                'start': seg['start'],
                'end': seg['end'],
                'note': seg['reason']
            })

        video_jobs[job_id]['status'] = 'completed'
    except Exception as e:
        video_jobs[job_id]['status'] = 'error'
        video_jobs[job_id]['error'] = str(e)

    return jsonify({'job_id': job_id}), 200


@app.route('/status/<job_id>', methods=['GET'])
def check_status(job_id):
    job = video_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job)


@app.route('/clips/<job_id>/<filename>')
def serve_clip(job_id, filename):
    return send_from_directory(f'clips/{job_id}', filename)


# Note: Removed app.run() to avoid SystemExit in restricted/sandboxed environments.
# To run the server externally, use: `flask run` from command line or appropriate entry point.
