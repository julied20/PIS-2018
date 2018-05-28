from flask import Flask, request
import base64
import io
import json
from PIL import Image

from utils import get_medial_axis_distance

# Start flask app
app = Flask(__name__)

# Serves the only page of the app
@app.route('/')
def home():
    return app.send_static_file('index.html')

# Takes a canvas drawing image and applies the pipeline to it
# to obtain distance image
@app.route('/image_pipeline', methods=['POST'])
def image_pipeline():
    # Get the image sent through the POST
    img64 = request.form['img']

    # Trim the base64 image overhead
    img64 = img64.replace('data:image/png;base64,', '')

    # Convert as bytes
    imgbytes = base64.b64decode(img64)

    # Open the image in PIL
    img = Image.open(io.BytesIO(imgbytes))

    # Apply the image processing pipeline
    # Get the distance image and the principal axis angle
    distance, angle = get_medial_axis_distance(img)

    # Return both through the POST answer
    jsondata = json.dumps({
        'angle': angle,
        'distance': distance.tolist()})

    return jsondata




