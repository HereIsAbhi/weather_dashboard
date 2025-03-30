import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [cityImage, setCityImage] = useState('');

  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'YOUR_API_KEY';
  const UNSPLASH_API_KEY = process.env.REACT_APP_UNSPLASH_API_KEY || 'YOUR_UNSPLASH_API_KEY';

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    // Save recent searches to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addToRecentSearches = (cityName) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== cityName);
      return [cityName, ...filtered].slice(0, 5);
    });
  };

  // Function to get background image based on weather condition
  const getBackgroundImage = (weatherCode) => {
    const images = {
      '01': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Clear sky
      '02': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Few clouds
      '03': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Scattered clouds
      '04': 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Broken clouds
      '09': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Shower rain
      '10': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Rain
      '11': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Thunderstorm
      '13': 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Snow
      '50': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', // Mist
    };
    return images[weatherCode] || images['01'];
  };

  // Function to fetch city landmark image
  const fetchCityImage = async (cityName) => {
    try {
      const response = await axios.get(
        `https://api.unsplash.com/search/photos?query=${cityName} landmark&orientation=landscape&per_page=1`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_API_KEY}`
          }
        }
      );
      
      if (response.data.results.length > 0) {
        setCityImage(response.data.results[0].urls.regular);
      } else {
        // Fallback to a default city image if no results found
        setCityImage('https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');
      }
    } catch (error) {
      console.error('Error fetching city image:', error);
      setCityImage('https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');
    }
  };

  // Update background image when weather changes
  useEffect(() => {
    if (weather?.weather[0]?.icon) {
      const weatherCode = weather.weather[0].icon.substring(0, 2);
      setBackgroundImage(getBackgroundImage(weatherCode));
    }
  }, [weather]);

  // Update city image when weather changes
  useEffect(() => {
    if (weather?.name) {
      fetchCityImage(weather.name);
    }
  }, [weather]);

  const fetchWeatherData = async (cityName) => {
    if (!cityName) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`)
      ]);

      setWeather(weatherResponse.data);
      setForecast(forecastResponse.data);
      addToRecentSearches(cityName);
    } catch (err) {
      setError('City not found. Please try again.');
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeatherData(city);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeatherData(city);
    }
  };

  const refreshWeather = () => {
    if (weather) {
      fetchWeatherData(weather.name);
    }
  };

  // Group forecast data by day
  const groupedForecast = forecast?.list?.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'}`}>
      {/* City Landmark Image */}
      <AnimatePresence mode="wait">
        {cityImage && (
          <motion.div
            key={cityImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${cityImage})` }}
          />
        )}
      </AnimatePresence>

      {/* Weather Condition Background */}
      <AnimatePresence mode="wait">
        {backgroundImage && (
          <motion.div
            key={backgroundImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
      </AnimatePresence>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 relative">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-4xl"
            >
              🌤️
            </motion.div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Weather Dashboard
            </h1>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 shadow-lg"
          >
            {darkMode ? '🌞' : '🌙'}
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-3">
            <motion.form 
              onSubmit={handleSubmit} 
              className="flex gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter city name"
                  className="w-full px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border-2 border-transparent focus:border-white/30 focus:outline-none shadow-lg text-white placeholder-white/60 dark:bg-gray-800/50"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl -z-10"></div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Search
              </motion.button>
            </motion.form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-6 py-4 rounded-2xl mb-6 shadow-lg"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {weather && (
                <motion.div
                  key="weather"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {weather.name}, {weather.sys.country}
                      </h2>
                      <p className="text-gray-200">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                      onClick={refreshWeather}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-6">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <img
                          src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                          alt={weather.weather[0].description}
                          className="w-24 h-24 drop-shadow-2xl"
                        />
                      </motion.div>
                      <div>
                        <p className="text-6xl font-bold text-white mb-2">
                          {Math.round(weather.main.temp)}°C
                        </p>
                        <p className="text-2xl text-gray-200 capitalize">
                          {weather.weather[0].description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-gray-300 text-sm mb-1">Humidity</p>
                        <p className="text-2xl font-semibold text-white">{weather.main.humidity}%</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-gray-300 text-sm mb-1">Wind Speed</p>
                        <p className="text-2xl font-semibold text-white">{Math.round(weather.wind.speed * 3.6)} km/h</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-gray-300 text-sm mb-1">Feels Like</p>
                        <p className="text-2xl font-semibold text-white">{Math.round(weather.main.feels_like)}°C</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-gray-300 text-sm mb-1">Pressure</p>
                        <p className="text-2xl font-semibold text-white">{weather.main.pressure} hPa</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {forecast && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4"
              >
                {Object.entries(groupedForecast).slice(0, 5).map(([date, forecasts], index) => {
                  const dayForecast = forecasts[Math.floor(forecasts.length / 2)];
                  return (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10"
                    >
                      <p className="text-sm text-gray-300 mb-2">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <img
                        src={`http://openweathermap.org/img/wn/${dayForecast.weather[0].icon}.png`}
                        alt={dayForecast.weather[0].description}
                        className="w-16 h-16 mx-auto mb-3"
                      />
                      <p className="text-2xl font-semibold text-center text-white mb-1">
                        {Math.round(dayForecast.main.temp)}°C
                      </p>
                      <p className="text-sm text-gray-300 text-center capitalize">
                        {dayForecast.weather[0].description}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/10"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Recent Searches</h3>
              <div className="space-y-3">
                {recentSearches.map((searchedCity, index) => (
                  <motion.button
                    key={searchedCity + index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => {
                      setCity(searchedCity);
                      fetchWeatherData(searchedCity);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white"
                  >
                    {searchedCity}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
