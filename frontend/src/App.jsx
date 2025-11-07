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
      <button class="title-button">
        <span class="top-text">BEST TRIPS WITH</span>
        <span class="main-text">FOOD FOR MORE</span>
      </button>
    </div>
  );
}

export default App;