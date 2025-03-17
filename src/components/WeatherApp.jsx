import React, { useState } from "react";
import axios from "axios";

const WeatherApp = () => {
    const [city, setCity] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState("");

    const fetchWeather = async () => {
        try {
            const response = await axios.get(
                `https://api.weatherapi.com/v1/current.json?key=${import.meta.env.VITE_APP_WEATHER_API_KEY}&q=${city}`
            );
            console.log(response.data);
            setWeatherData(response.data);
            setError("");
        } catch (err) {
            console.log(err);
            setError("Không tìm thấy thành phố. Vui lòng thử lại.");
            setWeatherData(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Dự Báo Thời Tiết</h1>
            <input
                type="text"
                placeholder="Nhập tên thành phố"
                className="p-2 border border-gray-300 rounded mb-4"
                value={city}
                onChange={(e) => setCity(e.target.value)}
            />
            <button
                onClick={fetchWeather}
                className="bg-blue-500 text-white p-2 rounded"
            >
                Xem Thời Tiết
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {weatherData && (
                <div className="mt-4">
                    <h2 className="text-xl">{weatherData.location.name}</h2>
                    <p className="text-lg">{weatherData.current.temp_c} °C</p>
                    <p>{weatherData.current.condition.text}</p>
                    <img
                        src={weatherData.current.condition.icon}
                        alt="weather icon"
                    />
                </div>
            )}
        </div>
    );
};

export default WeatherApp;
