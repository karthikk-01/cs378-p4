import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// City coordinates for preset buttons
const CITIES = {
  "Austin": { lat: 30.2672, lon: -97.7431 },
  "Dallas": { lat: 32.7767, lon: -96.7970 },
  "Houston": { lat: 29.7604, lon: -95.3698 }
};

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [city, setCity] = useState("Austin");
  const [newCity, setNewCity] = useState("");
  const [customCities, setCustomCities] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Function to fetch weather data
  const fetchWeatherData = async (latitude, longitude, cityName) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&temperature_unit=fahrenheit&forecast_days=2`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data for ${cityName}`);
      }
      
      const data = await response.json();
      
      // Process all times - 24 hours
      const processedData = [];
      for (let i = 0; i < 24; i++) {
        const timeString = data.hourly.time[i];
        const date = new Date(timeString);
        processedData.push({
          time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          temperature: Math.round(data.hourly.temperature_2m[i]),
          rawTime: date
        });
      }
      
      setWeatherData(processedData);
      setCity(cityName);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setError(`Error fetching weather data for ${cityName}. Please try again.`);
      setLoading(false);
    }
  };

  // Function to handle adding a new city
  const handleAddCity = async () => {
    if (!newCity.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Use Geocoding API to get coordinates for the city name
      const geocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newCity)}&count=1&language=en&format=json`
      );
      
      if (!geocodingResponse.ok) {
        throw new Error("Geocoding API request failed");
      }
      
      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.results || geocodingData.results.length === 0) {
        throw new Error(`Could not find weather for ${newCity}`);
      }
      
      const { latitude, longitude, name } = geocodingData.results[0];
      
      // Add to custom cities
      setCustomCities(prev => ({
        ...prev,
        [name]: { lat: latitude, lon: longitude }
      }));
      
      // Fetch weather data for the new city
      await fetchWeatherData(latitude, longitude, name);
      setNewCity("");
    } catch (error) {
      console.error("Error adding city:", error);
      setError(`Could not find weather for ${newCity}`);
      setLoading(false);
    }
  };

  // Load initial data for Austin when component mounts
  useEffect(() => {
    fetchWeatherData(CITIES.Austin.lat, CITIES.Austin.lon, "Austin");
  }, []);

  // Create data for the chart
  const chartData = weatherData.map(item => ({
    time: item.time,
    temperature: item.temperature
  }));

  return (
    <div className="weather-container">
      <header className="app-header">
        <h1>Weather Forecast</h1>
      </header>
      
      {/* City buttons */}
      <div className="city-buttons">
        {Object.keys(CITIES).map(cityName => (
          <button
            key={cityName}
            onClick={() => fetchWeatherData(CITIES[cityName].lat, CITIES[cityName].lon, cityName)}
            className={`city-btn ${city === cityName ? 'active' : ''}`}
          >
            {cityName}
          </button>
        ))}
        
        {/* Custom city buttons */}
        {Object.keys(customCities).map(cityName => (
          <button
            key={cityName}
            onClick={() => fetchWeatherData(customCities[cityName].lat, customCities[cityName].lon, cityName)}
            className={`city-btn ${city === cityName ? 'active' : ''}`}
          >
            {cityName}
          </button>
        ))}
      </div>
      
      {/* Add city input */}
      <div className="city-input">
        <input
          type="text"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Enter city name"
        />
        <button onClick={handleAddCity} className="add-btn">+</button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <div className="loading-indicator">Loading weather data...</div>
      ) : (
        <>
          {/* Weather data visualization */}
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={['auto', 'auto']} label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#0277bd" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Weather data table */}
          <div className="forecast-container">
            <h2>Hourly Forecast for {city}</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Temperature</th>
                  </tr>
                </thead>
                <tbody>
                  {weatherData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'row-alt' : ''}>
                      <td>{item.time}</td>
                      <td>{item.temperature} °F</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherApp;