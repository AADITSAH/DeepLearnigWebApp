const mongoose= require ('mongoose');

const Schema =mongoose.Schema;

const EmotionDetectionSchema = new Schema( {
    // image:String,    
    // emotion_type:String,
    // probability:Number
    name: String,
    desc: String,
    emotion_type:String,
    probability:Number,
    img:
    {
        data: Buffer,
        contentType: String
    }
});


module.exports=mongoose.model('EmotionDetection',EmotionDetectionSchema);