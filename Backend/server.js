const express=require('express');
const dotenv=require('dotenv');
const mongodb=require('mongoose')
const jwt=require('jsonwebtoken')
const User=require('./models/user')
const cors=require('cors');
const cookieParser=require('cookie-parser')
const webSocket=require('ws');
const Message=require('./models/message');

const app=express()

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:'http://localhost:5173',credentials:true}))
dotenv.config();

console.log(process.env.DB_URL)

mongodb.connect(process.env.DB_URL)

app.post('/register',async (req,res)=>{
    const {username,password}=req.body;
    
    try{
    const registerDetails=await User.create({username,password});

    jwt.sign({username,id:registerDetails._id},process.env.SECRETKEY,{},(err,token)=>{
        if(err) throw err;
        res.cookie('token',token).status(201).json({username,id:registerDetails._id})
    })
    }
    catch(err){
        console.log(err);
    }
})

app.get('/profile',(req,res)=>{
    const token=req.cookies.token;

    if(token){
        jwt.verify(token,process.env.SECRETKEY,{},(err,info)=>{
            if (err) throw err;
            res.json({login:true,username:info.username,id:info.id})
        })
    }

    else{
        res.json({login:false})
    }


})

app.post('/login',async (req,res)=>{
    const {username,password}=req.body;

    try{
    const loginDetails=await User.findOne({username});
    
    if(password===loginDetails.password){
        jwt.sign({username,id:loginDetails._id},process.env.SECRETKEY,{},(err,token)=>{
            if(err) throw err;
            res.cookie('token',token).status(200).json({username,id:loginDetails._id})
    })}

    else{
        res.status(204).json({error:"incorrect Password"});
    }

    }
    catch(err){
        console.log(err);
    }
})


app.get('/logout',(req,res)=>{
    const singleToken=req.cookies.token;
    if(singleToken){
        jwt.verify(singleToken,process.env.SECRETKEY,{},(err,info)=>{
            if(err) throw err; 
            res.cookie('token','').json(info)
        })
    }
    else{
        res.json({token:false})
    }
})

app.put('/updateData',(req,res)=>{
    const {token}=req.cookies;
    const {partner,prevPartner}=req.body;
    if(token){
        jwt.verify(token,process.env.SECRETKEY,{},async (err,info)=>{
            if(err) throw err; 
            await Message.updateMany({recipient:info.username,sender:partner},{$set:{checked:true}})
            await Message.updateMany({recipient:info.username,sender:prevPartner},{$set:{checked:true}})
            const updatedData=await Message.find();
            console.log(prevPartner);
            res.json({texts:updatedData})
        })
    }

})

app.get('/allusers',async (req,res)=>{
    const {token}=req.cookies;
    jwt.verify(token,process.env.SECRETKEY,{},async (err,info)=>{
        if (err) throw err;
        const allUSers=await User.find({username:{$ne:`${info.username}`}});
        res.json({"registered":allUSers})
    })
})

const server = app.listen(process.env.PORT);

const wss = new webSocket.WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
    const tokenCookieString = req.headers.cookie;
    if (tokenCookieString) {
        const token = tokenCookieString.split(';').find(c => c.trim().startsWith('token='));
        if (token) {
            const reqToken = token.split("=")[1];
            jwt.verify(reqToken, process.env.SECRETKEY, {}, (err, info) => {
                if (err) throw err;
                const { username, id } = info;

                ws.username = username;
                ws.userId = id;

                console.log("new Connection",ws.username)
            });
        }
    }

    function notifyAboutOnlinePeople(userTemp) {
        const loggedUsers=[...wss.clients].filter((client)=>{
            return true;
        })

        loggedUsers.forEach(client => {
            if (client.readyState === webSocket.OPEN) {
                client.send(JSON.stringify({
                    history: false,
                    message: false,
                    alivePeople: loggedUsers.map(c => ({ username: c.username, userId: c.userId }))
                }));
            }
        })
      }

    ws.isAlive = true;

    ws.timer = setInterval(() => {
      ws.ping();
      ws.deathTimer = setTimeout(() => {
        ws.isAlive = false;
        clearInterval(ws.timer);
        ws.terminate();
        notifyAboutOnlinePeople(ws.username);
        console.log('dead');
      }, 1000);
    }, 2000);
  
    ws.on('pong', () => {
      clearTimeout(ws.deathTimer);
    });



    [...wss.clients].forEach(client => {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify({
                history: false,
                message: false,
                alivePeople: [...wss.clients].map(c => ({ username: c.username, userId: c.userId }))
            }));
        }
    });

    const peopleData = await Message.find();
    ws.send(JSON.stringify({ history: true, message: true, data: peopleData }));

    ws.on('message', async (message) => {
        const newmessage = JSON.parse(message.toString());
        
        
        if (newmessage.action === 'logout'){
            /*ws.terminate();*/ // Immediately close the connection
            // Notify all clients about the current active users after logout
            /*const loggedUsers=[...wss.clients].filter((client)=>{
                return client.username!==ws.username;
            })*/
            /*
            loggedUsers.forEach(client => {
                if (client.readyState === webSocket.OPEN) {
                    client.send(JSON.stringify({
                        history: false,
                        message: false,
                        alivePeople: loggedUsers.map(c => ({ username: c.username, userId: c.userId }))
                    }));
                }
            });*/
        } else {
            const savedChat = await Message.create({
                sender: ws.username,
                recipient: newmessage.recipient,
                text: newmessage.text,
                checked:false
            });

            console.log(savedChat)
            const onlineUsers = [...wss.clients].filter(connection => {
                return connection.username === savedChat.recipient || connection.username === savedChat.sender;
            });


            onlineUsers.forEach(connection => {
                if (connection.readyState === webSocket.OPEN) {
                    console.log(connection.username)
                    connection.send(JSON.stringify({
                        history: false,
                        message: true,
                        sender: savedChat.sender,
                        recipient: savedChat.recipient,
                        text: newmessage.text,
                        _id: savedChat._id,
                        checked:savedChat.checked,
                        createdAt:savedChat.createdAt,
                    }));
                }
            });
        }
    });

    console.log("hey")

    /*console.log([...wss.clients].map(c => ({ username: c.username, userId: c.userId })));*/

    ws.on('close', () => {
        /*[...wss.clients].forEach(client => {
            if (client.readyState === webSocket.OPEN) {
                client.send(JSON.stringify({
                    history: false,
                    message: false,
                    alivePeople: [...wss.clients].map(c => ({ username: c.username, userId: c.userId }))
                }));
            }
        });*/
        console.log(`Connection closed for user: ${ws.username}`);     // Optionally, you can remove the user from any tracking lists here if needed
    });
});