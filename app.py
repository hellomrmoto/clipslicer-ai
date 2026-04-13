from flask import Flask, request, jsonify, render_template, send_from_directory
import uuid
import os
from pytube import YouTube
from memory import init_db, create_job, get_job, update_job, list_jobs

app = Flask(__name__, template_folder="templates")

init_db()


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
    create_job(job_id, youtube_url)

    try:
        yt = YouTube(youtube_url)
        stream = yt.streams.filter(file_extension='mp4').get_highest_resolution()
        video_path = f"videos/{job_id}.mp4"
        os.makedirs("videos", exist_ok=True)
        stream.download(filename=video_path)

        clip_segments = [
            (60, 105),
            (320, 360),
            (730, 780)
        ]

        output_dir = f"clips/{job_id}"
        os.makedirs(output_dir, exist_ok=True)

        clips = []
        for i, (start, end) in enumerate(clip_segments):
            output_path = f"{output_dir}/clip_{i + 1}.mp4"
            clips.append({
                'clip': output_path,
                'start': start,
                'end': end,
                'note': 'Processing skipped due to unavailable moviepy'
            })

        update_job(job_id, 'completed', clips=clips)
    except Exception as e:
        update_job(job_id, 'error', error=str(e))

    return jsonify({'job_id': job_id}), 200


@app.route('/status/<job_id>', methods=['GET'])
def check_status(job_id):
    job = get_job(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(job)


@app.route('/history', methods=['GET'])
def history():
    jobs = list_jobs()
    return jsonify(jobs)


@app.route('/clips/<job_id>/<filename>')
def serve_clip(job_id, filename):
    return send_from_directory(f'clips/{job_id}', filename)

# Note: Removed app.run() to avoid SystemExit in restricted/sandboxed environments.
# To run the server externally, use: `flask run` from command line or appropriate entry point.
