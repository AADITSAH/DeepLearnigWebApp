if (process.env.NODE_ENV!=="production"){
	require('dotenv').config();
}

const express= require ("express");
const {spawn} = require('child_process');
const path =require('path');
const mongoose=require('mongoose');
const EmotionDetection= require('./models/emodetection');
const ejsMate= require('ejs-mate');
const multer  = require('multer')

//const upload = multer({ dest: 'uploads/' ,limits: { fileSize: 1000000 }})
const http = require('http');
const querystring = require('querystring');
const axios = require('axios').default;
const  FormData=require('form-data');
const fs=require('fs');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const bodyParser = require('body-parser');
//const { storage } = require('./cloudinary');
//const upload = multer({ storage });



mongoose.connect(' mongodb://127.0.0.1:27017/emotion-detection', {
	useNewUrlParser:true,
	useCreateIndex:true,
	useUnifiedTopology:true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error"));
db.once("open",()=>{
	// gfs = Grid(conn.db, mongoose.mongo)
    // gfs.collection('imageUpload')
	console.log("DataBase connected")
});



const app=express();
app.use(express.urlencoded({extended:true})); 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'))
// app.use((req,res)=>{
// 	console.log("got request")
// });

app.get('/',(req,res)=>{
	res.render('home')
});



app.get('/emodetect', async (req,res)=>{
	const emote_detection = await EmotionDetection.find({});
	res.render('emodetect/index',{emote_detection})
});

app.get('/emodetect/new', (req,res)=>{
	res.render('emodetect/new')
})

var upload = multer({ storage: storage })
app.post('/emodetect', upload.single('image'), async(req, res, next) => {
	console.log(req.body, req.file)
	var obj = {
        name: req.file.filename,
        desc: req.file.originalname,
		emotion_type:"",
    	probability:-1,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: req.file.mimetype
        }
    }
     EmotionDetection.create(obj, async (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            // item.save();
          await   axios({
                method: 'post',
                url: 'http://127.0.0.1:5000/predict',
                params:{
                    image:req.file.filename
                }
            }).then(function (response) {
                console.log(response.data);
            res.redirect('/emodetect');
        });
        }
        
    });	
  
});


	


app.get('/python',(req,res)=>{
	var dataToSend;
	const python = spawn('python', ['./python/check.py',4,5]);

	python.stdout.on('data', function (data) {
  		
  		dataToSend = data.toString();
  		console.log(`Pipe data from python script :${dataToSend}`);
  		res.send(dataToSend)
    });

	python.stderr.on('data', (data) => {
	  console.error(`stderr: ${data}`);
	});
	python.on('close', (code) => {
 		console.log(`child process close all stdio with code ${code}`);
 // send data to browser
 		//res.send(dataToSend)
    });
});

app.listen(3000,()=>{
	console.log("listening to port 3000!");
});