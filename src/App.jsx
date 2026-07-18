import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1>Simple React App</h1>
        <p>Ready to deploy on free hosting platforms</p>
      </header>
      
      <main className="main">
        <div className="card">
          <h2>Interactive Counter</h2>
          <div className="counter">
            <button onClick={() => setCount(count - 1)}>-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
          <button className="reset" onClick={() => setCount(0)}>
            Reset
          </button>
        </div>

        <div className="info">
          <h3>Deployment Options</h3>
          <ul>
            <li><strong>Netlify</strong> - Drag and drop the dist folder</li>
            <li><strong>Vercel</strong> - Connect your GitHub repository</li>
            <li><strong>GitHub Pages</strong> - Use gh-pages branch</li>
          </ul>
        </div>
      </main>

      <footer className="footer">
        <p>Built with React + Vite</p>
      </footer>
    </div>
  )
}

export default App
