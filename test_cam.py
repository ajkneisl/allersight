from flask import Flask, Response
import cv2

app = Flask(__name__)
cam = cv2.VideoCapture(0)

def gen():
    while True:
        ok, frame = cam.read()
        if not ok:
            break
        _, buf = cv2.imencode('.jpg', frame)
        yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n'

@app.route('/')
def feed():
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

app.run(host='0.0.0.0', port=5000)
