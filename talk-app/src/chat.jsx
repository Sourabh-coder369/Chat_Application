import { useState,useEffect,useRef} from "react";
import { UserContext } from "./context";
import { useContext } from "react";
import axios  from "axios";
import { Register } from "./register";
import {uniqBy} from 'lodash'
import { useCallback } from "react";
import { MessageSquare, LogOut, Send } from 'lucide-react';

let wss=null;
let uncheckedFlag=null
let prevSelectedUsername="";
let globalAllUsers=[];


export function Chat(){
    //const [wss,setWss]=useState(null)
    const [textValue,setTextValue]=useState("");
    const {username,setUsername,id,setId}=useContext(UserContext)
    const [flag,setFlag]=useState(false);
    const [activePeople,setActivePeople]=useState({});
    const [activePeopleId,setActivePeopleId]=useState([]);
    const [selectedUsername,setsSelectedUsername]=useState(null);
    const [messages,setMessages]=useState([]);
    const [unchecked,setUnchecked]=useState(null)
    const [latestMessage,setLatestMessage]=useState(null);
    const [mountedMessages,setMountMessages]=useState(null);
    const [allUSers,setAllUSers]=useState([]);
    const messageEnd=useRef(null)
    const callback = useCallback((e) => {
        console.log(e);
        console.log("WebSocket Closed, attempting to reconnect...");
        setTimeout(connectWs, 1000);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/profile');
                console.log("login",res.data.login);
                if(res.data.login) {
                    //console.log("entered");
                    setUsername(res.data.username);
                    setId(res.data.id);
                    if(!wss){
                    connectWs(); // Call connectWs directly
                }
            }
                setFlag(true);
            }catch (err) {
                console.log(err);
            }
        };
        fetchProfile();

        return(()=>{
            if(wss){
            console.log("removing old connections")
            wss.removeEventListener('close',callback);
            handleClose();}})
            //console.log("username",username)
    },[username]) // Empty dependency array to run only on mount

    useEffect(()=>{
        if(messageEnd.current){
            messageEnd.current.scrollTop=messageEnd.current.scrollHeight;
        }
    },[messages,selectedUsername])

    useEffect(()=>{
        console.log("ALLUserS changed",allUSers)
    },[allUSers])

    useEffect(()=>{
        console.log("changed",unchecked,latestMessage)
        if(uncheckedFlag && latestMessage){
            /*setUnchecked(prev =>(
                prev.map(({name,value})=>{
                    if(name==latestMessage.sender){
                        return {name,value:value+1}
                    }
                    else{
                        return {name,value:value}
                    }
                })
            ))*/
            uncheckedFlag=uncheckedFlag.map(({name,value})=>{
                if(name==latestMessage.sender && name!=activePeople[selectedUsername]){
                    return {name,value:value+1}
                }
                else{
                    return {name,value:value}
                }
            })

            setUnchecked(uncheckedFlag)
            }
    },[latestMessage])

    useEffect(()=>{
        if(mountedMessages){
            console.log("mounted messages",mountedMessages)
            mountedMessages.forEach((message)=>{
                if(message.sender!=username && message.checked===false && message.recipient==username){
                    uncheckedFlag=uncheckedFlag.map(({name,value}) =>{
                        if(name==message.sender && name!=activePeople[selectedUsername]){
                            return {name,value:value+1}
                        }
                        else{
                            return {name,value:value}
                        }
                    })}
                })
            console.log("inside mount",uncheckedFlag)
            setUnchecked(uncheckedFlag);
        }
    },[mountedMessages])


    useEffect(()=>{
        if(selectedUsername){
            axios.put('/updateData',{partner:activePeople[selectedUsername],prevPartner:activePeople[prevSelectedUsername]}).then((res)=>{console.log(res.data);
            uncheckedFlag.forEach((client)=>{
                client.value=0;
            })
            setMessages([...res.data.texts])
        setMountMessages([...res.data.texts])
        })}
    },[selectedUsername])

    useEffect(()=>{
        if(allUSers && activePeopleId){
        const arrUsers=[...allUSers]

        let arr2=[...allUSers].sort((a,b)=>{
            const aInArr1 = activePeopleId.includes(a._id);
            const bInArr1 = activePeopleId.includes(b._id);

            if(aInArr1 && bInArr1){
                return activePeopleId.indexOf(a._id)-activePeopleId.indexOf(b._id)
            }

            else if(aInArr1){
                return -1;
            }

            else if(bInArr1){
                return 1;
            }
            else{
                return 0;
            }
        })
        
        if(JSON.stringify(allUSers)!=JSON.stringify(arr2)){
        setAllUSers([...arr2]);}
        globalAllUsers=arr2;
        console.log("arr2",arr2,"arr1",activePeopleId);
}
    },[activePeopleId,allUSers])


    function handleClose(){
        wss.close(1000, 'user logged out'); 
        wss=null;       
        console.log('user logged out')
    }

    function destory(){
        console.log("Event listener removed");
        handleClose()
        setUsername(()=>(''));
        setId(()=>(''));
    }

    async function logout(){
        const res=await axios.get('/logout');
        //console.log(res)

        wss.send(JSON.stringify({action:"logout"}))


        wss.removeEventListener('close',callback);

        destory();

    }

    async function connectWs() {
        //const ws = new WebSocket('ws://localhost:4000');
        wss = new WebSocket('ws://localhost:4000');
    
        wss.onopen = () => {
            console.log("WebSocket Connected");
            //setWss(ws);
        };
    

        wss.addEventListener('message', handleMessage);
    
        wss.addEventListener('close',callback);

        const allRegister=await axios.get('/allusers')

        
        //console.log("arr2",arr2,activePeopleId)
        setAllUSers([...allRegister.data["registered"]])
    
        /*return () => {
            ws.removeEventListener('message', handleMessage);
            console.log("hello");
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };*/
    }
    

    
    function handleMessage(e){
        const typeInfo=JSON.parse(e.data);
        if(!typeInfo.message){
            const onlinePeople=typeInfo.alivePeople
            let people={};
            onlinePeople.forEach(element => {
                people[element.userId]=element.username
            });

            let arr=Object.keys({...people})

            const tempUnchecked=Object.values(people).map((client)=>(
                {name:client,value:0}
            ))

            uncheckedFlag=tempUnchecked;

            console.log("people",people)
            //console.log(tempUnchecked);
            //setUnchecked(tempUnchecked);
            
            setActivePeople(()=>({...people}))
            setActivePeopleId(arr)}
        
        else{
            if(typeInfo.history){
                setMountMessages([...typeInfo.data])
                setMessages(()=>([...typeInfo.data]))
            }

            else{
            console.log("latestmessage",typeInfo)
            setLatestMessage(typeInfo)
            /*if(unchecked){
                setUnchecked(prev =>(
                    prev.map(({name,value})=>{
                        if(name==typeInfo.sender){
                            return {name,value:value+1}
                        }
                        else{
                            return {name,value:value}
                        }
                    })
                ))}*/
            setMessages((prev)=>([...prev,typeInfo]))}
        }
        
    }

    function sendMessage(){
        if (wss && wss.readyState === WebSocket.OPEN) {
            wss.send(JSON.stringify({
                recipient:activePeople[selectedUsername],
                sender:username,
                text:textValue,
            }));
            
            setTextValue("");
        } else {
            console.log("WebSocket not ready!");
        }
    }

    function formatTo12HourTime(createdAt) {
        const date = new Date(createdAt); // Convert the createdAt timestamp to a Date object
        let hours = date.getHours(); // Get hours (0-23)
        const minutes = date.getMinutes(); // Get minutes
        const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM/PM
    
        // Convert 24-hour time to 12-hour time
    
        // Format minutes to always show two digits
        const formattedMinutes = minutes.toString().padStart(2, "0");
    
        // Return the formatted time
        return `${hours}:${formattedMinutes}`;
    }

    function formatCreatedAt(createdAt) {
        const dateObj = new Date(createdAt); // Convert the MongoDB timestamp to a Date object
      
        const date = dateObj.getDate(); // Get the day of the month (1-31)
        const year = dateObj.getFullYear(); // Get the year (e.g., 2025)
      
        // Get the month as a string (e.g., "January")
        const month = dateObj.toLocaleString("default", { month: "long" });
        
        console.log("date",`${date} ${month} ${year}`)

        return `${date} ${month} ${year}`;
    }

    function formatDay(createdAt){
        const dateObj = new Date(createdAt);
        const date=dateObj.getDate();

        return date;
    }

    const modifiedArr=activePeopleId.filter((ele)=>{
        return ele!=id;
    })


    let updatedMessages=uniqBy(messages,'_id');
    updatedMessages=updatedMessages.filter((message)=>{
        if((message.sender==activePeople[selectedUsername] && message.recipient==username) || (message.recipient==activePeople[selectedUsername] && message.sender==username)){
                return true;
        }
        else{
            return false;
        }
    })
    

    //console.log("modifified",unchecked)
    //console.log("late",unchecked)
    //console.log("allUsers",allUSers)
    //console.log(uncheckedFlag,mountedMessages)
    console.log("messages",updatedMessages)
    let tempDay=0;
    if(username=='' && flag){
        return(<Register/>);
    }

    return (
        
        <div className="h-screen flex bg-black text-gray-200">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-blue-400">MernChat</h1>
            </div>
          </div>
      
          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {allUSers.map(client => (
              <div
                key={client._id}
                onClick={() => {
                  if (selectedUsername) prevSelectedUsername = selectedUsername;
                  setsSelectedUsername(client._id);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer shadow-md transition-transform duration-200 transform ${
                  client._id === selectedUsername
                    ? "bg-blue-500 text-white scale-105"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shadow-inner">
                    <span className="text-gray-200 text-lg font-semibold">
                      {client.username[0].toUpperCase()}
                    </span>
                  </div>
                  {modifiedArr.includes(String(client._id)) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>
      
                {/* Username */}
                <span className="font-medium text-lg flex-1">{client.username}</span>
      
                {/* Unread Count */}
                {unchecked?.map(obj =>
                  obj.name === client.username && obj.value > 0 ? (
                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow">
                      {obj.value}
                    </span>
                  ) : null
                )}
              </div>
            ))}
          </div>
      
          {/* User Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            {username && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">{username}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-800">
          {!selectedUsername ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-3xl text-gray-500 font-semibold">
                Select a conversation to start chatting
              </p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={messageEnd} className="flex-1 overflow-y-auto p-6 space-y-4">
                {updatedMessages.reduce((acc, message, idx) => {
                  const currentDay = formatDay(message.createdAt);
                  const prevDay = idx > 0 ? formatDay(updatedMessages[idx - 1].createdAt) : null;
      
                  // Add a date divider if the day changes
                  if (currentDay !== prevDay) {
                    acc.push(
                      <div
                        key={`day-divider-${currentDay}-${idx}`}
                        className="text-center text-sm text-gray-400 mb-2"
                      >
                        {formatCreatedAt(message.createdAt)}
                      </div>
                    );
                  }
      
                  // Add the actual message
                  acc.push(
                    <div
                      key={idx}
                      className={`flex ${
                        username === message.sender ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] text-xl rounded-lg p-4 shadow-md break-words ${
                          username === message.sender
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {/* Message Text */}
                        <div>{message.text}</div>
      
                        {/* Timestamp */}
                        <p
                          className={`text-sm mt-2 ${
                            username === message.sender ? "text-right" : "text-left"
                          } text-gray-400`}
                        >
                          {formatTo12HourTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
      
                  return acc;
                }, [])}
              </div>
      
              {/* Input Area */}
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    ); 
    }
