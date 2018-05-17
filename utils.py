import numpy as np

from PIL import Image, ImageDraw
from skimage.draw import polygon
from skimage.measure import regionprops, label, find_contours
from skimage.morphology import medial_axis

def get_medial_axis_distance(img):
    imsize = 50

    # x and y coordinates of shape contour points
    x_coordinates = []
    y_coordinates = []

    # Resize image to imsize
    img.thumbnail((imsize, imsize))

    img_array = np.array(img)

    # Convert to binary array
    bin_img_array = [[1 if pixel[3] == 255 else 0 for pixel in row] for row in img_array]

    # Find contours of shapes in the image
    contours = find_contours(bin_img_array, 0)

    # Fill x_coordinates and y_coordinates with contour points
    for contour_ in contours:
        for (x, y) in contour_:
            # Invert x and y to be compatible with back-end pipeline
            y_coordinates.append(imsize - x)
            x_coordinates.append(y)

    coordinates = (x_coordinates, y_coordinates)

    # Original binary image
    bin_image_orig = binary_image(imsize, *coordinates)

    # Unique orientation binary image
    x_coords_rot, y_coords_rot, angle = unique_orientation_coords(bin_image_orig, coordinates[0], coordinates[1])
    bin_image_rot = binary_image(imsize, x_coords_rot, y_coords_rot)

    # Centered binary image
    centroid = centroid_y(bin_image_rot, imsize)
    bin_image_center = binary_image_center(imsize, x_coords_rot, y_coords_rot, centroid)

    # Medial axis distance
    _, distance = medial_axis(bin_image_center, return_distance=True)

    return distance, angle


def binary_image(im_size, x_coordinates, y_coordinates):
    x_coordinates = np.array(x_coordinates, dtype=float)
    y_coordinates = np.array(y_coordinates, dtype=float)

    x_coordinates -= min(x_coordinates)
    y_coordinates -= min(y_coordinates)

    x_max = max(x_coordinates)
    y_max = max(y_coordinates)

    if x_max >= y_max:
        ratio = im_size / x_max

    else:
        ratio = im_size / y_max

    print(ratio)

    x_coordinates *= ratio
    y_coordinates *= ratio

    img = np.zeros((im_size, im_size), dtype=np.uint8)

    x, y = polygon(x_coordinates, y_coordinates)
    img[x, y] = 1

    return img


def binary_image_center(im_size, x_coordinates, y_coordinates, y_centroid):
    # In that space, y and x axis are inverted
    x_centroid = y_centroid

    x_coordinates = np.array(x_coordinates)
    y_coordinates = np.array(y_coordinates)

    x_coordinates -= min(x_coordinates)
    y_coordinates -= min(y_coordinates)

    y_max = max(y_coordinates)

    ratio = im_size / y_max

    x_coordinates *= ratio
    y_coordinates *= ratio

    x_coordinates = np.array([min(im_size - 1, max(0, x + im_size / 2 - x_centroid)) for x in x_coordinates])
    y_coordinates = np.array([min(im_size - 1, max(0, y)) for y in y_coordinates])

    img = np.zeros((im_size, im_size), dtype=np.uint8)

    x, y = polygon(x_coordinates, y_coordinates)

    img[x, y] = 1

    return img


def unique_orientation_coords(bin_image, x_coords, y_coords):
    props = regionprops(bin_image)

    angle = -props[0].orientation
    cos = np.cos(angle)
    sin = np.sin(angle)

    x_coords_rot = []
    y_coords_rot = []

    for i in range(len(x_coords)):
        x = x_coords[i]
        y = y_coords[i]

        x_coords_rot.append(x * cos - y * sin)
        y_coords_rot.append(y * cos + x * sin)


    return x_coords_rot, y_coords_rot, angle

def centroid_y(bin_img, im_size):
    y_counts = np.sum(bin_img, axis=1)
    indices = np.arange(im_size)

    return sum(y_counts * indices) / sum(y_counts)
