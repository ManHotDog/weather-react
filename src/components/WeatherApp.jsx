import React, { useState } from "react";
import axios from "axios";

const WeatherApp = () => {
    const [city, setCity] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState("");

    const fetchWeather = async () => {
        try {
            const response = await axios.get(
                `https://api.weatherapi.com/v1/forecast.json?key=${import.meta.env.VITE_APP_WEATHER_API_KEY}&q=${city}&days=7`
            );
            console.log(response.data);
            setWeatherData(response.data);
            setError("");
        } catch (err) {
            console.log(err);
            setError("City not found. Please try again.");
            setWeatherData(null);
        }
    };

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?q=80&w=2074&auto=format&fit=crop')" }}
        >
            <div className="flex flex-col items-center justify-center min-h-screen backdrop-blur-sm bg-black/30">
                <div className="w-full max-w-4xl p-6 rounded-lg">
                    <h1 className="text-4xl font-bold mb-8 text-white text-center">Weather Forecast</h1>
                    <div className="flex gap-4 justify-center mb-8">
                        <input
                            type="text"
                            placeholder="Enter city name"
                            className="p-3 border border-gray-300 rounded-lg w-64 bg-white/80 backdrop-blur-sm"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <button
                            onClick={fetchWeather}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors duration-200"
                        >
                            Get Weather
                        </button>
                    </div>

                    {error && <p className="text-red-500 mt-4 text-center bg-white/80 rounded-lg p-3">{error}</p>}
                    
                    {weatherData && (
                        <div className="space-y-8">
                            {/* Current Weather */}
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                                <h2 className="text-3xl font-bold mb-4">{weatherData.location.name}</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-5xl font-bold">{weatherData.current.temp_c}°C</p>
                                        <p className="text-xl mt-2">{weatherData.current.condition.text}</p>
                                        <div className="mt-4 space-y-1">
                                            <p>Humidity: {weatherData.current.humidity}%</p>
                                            <p>Wind: {weatherData.current.wind_kph} km/h</p>
                                        </div>
                                    </div>
                                    <img
                                        src={weatherData.current.condition.icon}
                                        alt="weather icon"
                                        className="w-24 h-24"
                                    />
                                </div>
                            </div>

                            {/* 7-day forecast */}
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {weatherData.forecast.forecastday.map((day) => (
                                    <div key={day.date} className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                                        <p className="font-semibold">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <img
                                            src={day.day.condition.icon}
                                            alt="forecast icon"
                                            className="w-16 h-16 mx-auto"
                                        />
                                        <div className="text-center">
                                            <p className="font-bold">{day.day.maxtemp_c}°C</p>
                                            <p className="text-gray-600">{day.day.mintemp_c}°C</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherApp;
