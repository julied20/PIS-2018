from flask import Flask, request
app = Flask(__name__)

@app.route('/')
def hello_world():
    return app.send_static_file('index.html')


@app.route('/image_pipeline', methods=['POST'])
def image_pipeline():
    img = request.form['img']

    print(img)

    # this method convert and save the base64 string to image
    #convert_and_save(img)




def convert_and_save(b64_string):

    b64_string += '=' * (-len(b64_string) % 4)  # restore stripped '='s

    string = b'{b64_string}'

    with open("tmp/imageToSave.png", "wb") as fh:
        fh.write(base64.decodebytes(string))
