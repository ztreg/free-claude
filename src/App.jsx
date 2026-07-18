import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1>Keep track of your Stocks</h1>
        <p>Monitor your investments in real-time</p>
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
      </main>

      <footer className="footer">
        <p>Built with React + Vite</p>
      </footer>
    </div>
  )
}

export default App
