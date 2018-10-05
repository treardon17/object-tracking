import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

// include scss
import './styles/base.scss'

// import pages
import Home from './pages/Home'

// define routes
const Routes = () => (
  <BrowserRouter>
    <div id="app-container">
      <Route exact path="/" component={() => <Home />} />
    </div>
  </BrowserRouter>
)

export default Routes
