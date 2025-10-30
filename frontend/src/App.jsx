import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState({});
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Gọi API của Flask. Nếu dùng proxy, chỉ cần đường dẫn tương đối.
    fetch('https://food-recommending-web.onrender.com/api/data') 
      .then(res => res.json())
      .then(data => {
        setData(data);
        console.log(data);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{data.message ? data.message : 'Welcome'}</h1>

        <div className="controls">
          <button
            className="go-button"
            aria-label="Start"
            onClick={() => setStarted(prev => !prev)}
          >
            GO
          </button>
        </div>

        {started && <p className="started-text">Started!</p>}

        {data.users && (
          <ul>
            {data.users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;