# sketch-a-lake

## Demo

Live demo here: https://sketch-a-lake.herokuapp.com (heroku is quite slow in the beginning, please be patient).

## Abstract

In classical search engines, the user usually uses words to retrieve some content. This approach works well for some applications but is very limited when it comes to searching for images with a certain shape or colour. This is why we built *sketch a lake*. This website allows the user to use his creativity to discover lakes all around Switzerland. By drawing a shape on a canvas, the user is able to search for some of the most similar-shaped lakes amongst the thousand detected in the Helvetic area. 

Using water areas tagged by the OpenStreetMap community, we were able to extract on one side cropped satellite images, and on the other side, vector shapes representing those areas. The shapes are scaled and rotated along their principal axis, making the comparison independent in size and orientation. We then use the distance between the medial axis of two shapes to compare them. The medial axis represents well the global shape of a lake without taking into account the granularity of its borders.

We constructed a Vantage Point tree structure containing all the medial axis images. This structure allows the finding, in an efficient way, the closest neighbours of a newly drawn shape, without comparing it to all the known lake shapes.

After a preprocessing time of 1.5 hours, the lake recognition is able to run smoothly in a browser. The image processing pipeline is computed in the backend for practical reasons, but it could be easily rewritten in JavaScript so that the application runs fully in the frontend.

## Screenshots

![Interface before drawing](https://i.imgur.com/e89jbI2.png)
![Interface after drawing](https://i.imgur.com/YQbXuG1.png)
![Interface after zoom](https://i.imgur.com/CkAunA8.png)
![OpenStreetMap link](https://i.imgur.com/8vbu7Yj.png)


## Installation

First, navigate to the project folder, create a virtual environment and install the requirements:

```bash
# You need pip and virtualenv installed globally
sudo apt install python3-pip
sudo pip3 install virtualenv 

# Make sure you are in the project folder. Replace <PROJECT_PATH> with your project path.
cd <PROJECT_PATH>

# Creates a virtualenv with python3
virtualenv -p python3 .env

# Activate the virtualenv
source .env/bin/activate

# Install the requirements
pip install -r requirements.txt
```

Then, to start the flask app we use gunicorn:

```bash
gunicorn run:app
```

That's it! This runs the app locally, available by default at http://127.0.0.1:8000/.

# Installation on heroku

If you want to install the app on heroku and run it online:

```bash
# Creates an heroku app. Replace <APP_NAME> by a unique app name. 
# It should create a heroku remote in your .git, if not use the git remote command
heroku create <APP_NAME>

# Push the code to the heroku remote. Your code should now run live
git push heroku master
```

More information in [this tutorial](https://medium.com/the-andela-way/deploying-a-python-flask-app-to-heroku-41250bda27d0).
