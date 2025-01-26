const {Schema,model}=require('mongoose')


const user=new Schema({
    username:{type:String,unique:true},
    password:{type:String},
})

const User=model('users',user);

module.exports=User;
