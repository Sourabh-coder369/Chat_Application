import { Register } from './register'
import axios from 'axios';
import { Userprovider } from './context';
import { Routes } from './route';
import { Chat } from './chat';

function App() {
  axios.defaults.baseURL='http://localhost:4000'
  axios.defaults.withCredentials=true;

  return (
    <Userprovider>
      <Routes/>
    </Userprovider>
  )
}

export default App
