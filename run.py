from flask import Flask, request
import base64
import io
import json


from PIL import Image

from utils import get_medial_axis_distance

app = Flask(__name__)

@app.route('/')
def hello_world():
    return app.send_static_file('index.html')


@app.route('/image_pipeline', methods=['POST'])
def image_pipeline():
    img64 = request.form['img']

    img64 = img64.replace('data:image/png;base64,', '')

    imgbytes = base64.b64decode(img64)

    img = Image.open(io.BytesIO(imgbytes))

    distance, angle = get_medial_axis_distance(img)

    print(distance)

    jsondata = json.dumps({
        'angle': angle,
        'distance': distance.tolist()})

    # this method convert and save the base64 string to image
    #convert_and_save(img)

    return jsondata




