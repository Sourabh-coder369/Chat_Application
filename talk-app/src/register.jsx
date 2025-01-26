import { useState,useEffect } from "react"
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "./context";
import { Chat } from "./chat";

export function Register(){

    const {username:newusername,setUsername:setLoginOrRegisterUsername}=useContext(UserContext)
    const [username,setusername]=useState("");
    const [password,setPassword]=useState("");
    const [loginOrRegister,setloginOrRegister]=useState('register');
    const [logged,setLogged]=useState(false);

    
    async function register(ev){
        ev.preventDefault();
        const res=await axios.post('/register',{username,password});
        console.log(res)
        setLoginOrRegisterUsername(res.data.username);
    }

    async function login(ev){
        ev.preventDefault();

        const response=await axios.post('/login',{username,password});
        console.log(response.request)
        if(response.request.status===200){
            setLoginOrRegisterUsername(response.data.username);
        }

        else{
            window.alert("incorrect Password");
        }
    }

    if(newusername){
        return(
            <Chat/>
        )
    }

    return (
        <div className="bg-gray-900 h-screen flex items-center justify-center">
          <form className="flex flex-col w-[400px] bg-gray-800 text-gray-200 p-8 rounded-lg shadow-lg gap-6">
            {/* Username Input */}
            <input
              className="p-4 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400"
              type="text"
              placeholder="Username"
              onChange={ev => setusername(ev.target.value)}
            />
      
            {/* Password Input */}
            <input
              className="p-4 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400"
              type="password"
              placeholder="Password"
              onChange={ev => setPassword(ev.target.value)}
            />
      
            {/* Register Button */}
            {loginOrRegister === 'register' && (
              <input
                className="bg-blue-500 p-4 rounded-md text-white hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200 cursor-pointer"
                type="button"
                value="Register"
                onClick={register}
              />
            )}
      
            {/* Login Button */}
            {loginOrRegister === 'login' && (
              <input
                className="bg-blue-500 p-4 rounded-md text-white hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200 cursor-pointer"
                type="button"
                value="Login"
                onClick={login}
              />
            )}
      
            {/* Toggle Between Login and Register */}
            {loginOrRegister === 'register' && (
              <div className="text-center text-gray-400">
                Already a member?{' '}
                <button
                  className="underline text-blue-400 hover:text-blue-500"
                  onClick={e => {
                    e.preventDefault();
                    setloginOrRegister('login');
                  }}
                >
                  Login
                </button>
              </div>
            )}
      
            {loginOrRegister === 'login' && (
              <div className="text-center text-gray-400">
                New member?{' '}
                <button
                  className="underline text-blue-400 hover:text-blue-500"
                  onClick={e => {
                    e.preventDefault();
                    setloginOrRegister('register');
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </form>
        </div>
      );
      
}