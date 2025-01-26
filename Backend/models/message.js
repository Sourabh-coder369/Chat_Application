const {Schema,model}=require('mongoose');

const messageSchema=new Schema({
    sender:{type:String},
    recipient:{type:String},
    text:{type:String},
    checked:{type:Boolean},
},{
    timestamps:true,
})

const Message=model('Message',messageSchema)

module.exports=Message;
