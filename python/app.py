from flask import Flask,render_template,request, jsonify
#from skimage import io
import keras
from keras.preprocessing import image
from PIL import Image
import pymongo
import base64
from io import BytesIO
from PIL import Image
from keras.models import load_model 
import numpy as np

myclient = pymongo.MongoClient("mongodb://127.0.0.1:27017")
mydb = myclient["emotion-detection"]
mycol = mydb["emotiondetections"]

#init app
app=Flask(__name__)

#Route
@app.route('/')
def index():
	return render_template('index.html')

# @app.route('/home')
# def home():
# 	pass_val="Let's Predict Somthing"
# 	return render_template('home.html', passing_val=pass_val)
	
@app.route('/home',methods=['GET','POST'])
def home():
	pass_val="Let's Predict Somthing"
	fn=""
	ln=""
	if request.method=='POST':
		fn=request.form['firstname']
		ln=request.form['lastname']
	return render_template('home.html', passing_val=pass_val,fn=fn,ln=ln)




@app.route('/predict',methods=['GET','POST'])
def predict():
	data = {"success": False, "emo_type":"","probability":"" }
	objects = ('angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral')
	#return data;
	loaded_model = load_model("cnn_network.h5") 
	if request.method=='POST':
		data["success"] = True
		#
		name=request.args.get('image')
		x=list(mycol.find({"name":name}))
		im_file = BytesIO(x[0]['img']['data'])  # convert image to file-like object
		# img1 = Image.open(im_file)
		
		#img= image.load_img(im_file, color_mode="grayscale", target_size=(48, 48))
		img2 = Image.open(im_file)
		target_size=(48,48)
		img2 = img2.convert('L')
		img2 = img2.resize(target_size, Image.NEAREST)
		x = image.img_to_array(img2)
		x = np.expand_dims(x, axis = 0)

		x /= 255

		custom = loaded_model.predict(x)
		a=custom[0]
		m=0.000000000000000000001
		for i in range(0,len(a)):
		    if a[i]>m:
		        m=a[i]
		        ind=i
		
		prob=a[a.argmax()]*100
		emo_type=objects[ind]

		myquery = { "name": name }
		newvalues = { "$set": { "emotion_type":  emo_type, "probability":prob} }

		mycol.update_one(myquery, newvalues)
	#return render_template('predict.html', val=data)
		# im = Image.open(file.stream)
		# img1 = img.load_img(im, color_mode="grayscale", target_size=(48, 48))
		# x = image.img_to_array(img1)
		# data["value"]="hello"
		# # print(x)
		data["emotion_type"]=emo_type
		data["probability"]=prob
		#data["val"{ "emotion_type":  emo_type, "probability":prob}]
		return jsonify(data)
#Templating


if __name__ =='__main__':
	app.run(debug=True)