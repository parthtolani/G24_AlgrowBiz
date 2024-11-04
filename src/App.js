  import React from 'react'
  import { BrowserRouter,Routes,Route } from 'react-router-dom'
  import Sign_up from './signup'
  import Login_page from './login'
  import { useState } from 'react'
  import Home_page from './home'
  import Landing_page from './landingpage'
  import ProtectedRoute from './ProtectedRoute'

  const App = () => {
    const [auth, setAuth] = useState(false);

    return (
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing_page/>}/>
        <Route path='/signup' element={<Sign_up setAuth={setAuth}/>}/>
        <Route path='/login' element={<Login_page setAuth={setAuth}/>}/>
        <Route path='/home' element={<ProtectedRoute auth={auth}><Home_page /></ProtectedRoute>}/>
      </Routes>
      </BrowserRouter> 
    )
  }

  export default App
