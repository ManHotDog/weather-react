import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { draggable, dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const cities = [
    // You'll need to import and parse your worldcities.csv data here
    // For now, I'll show the structure
    { name: "London", country: "United Kingdom", lat: "51.5074", lon: "-0.1278" },
    // ... more cities
];

const SearchBox = ({ onLocationSelect }) => {
    const [searchText, setSearchText] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const handleSearch = (text) => {
        setSearchText(text);
        if (text.trim().length > 1) {
            const filtered = cities
                .filter(city => 
                    city.name.toLowerCase().includes(text.toLowerCase()) ||
                    city.country.toLowerCase().includes(text.toLowerCase())
                )
                .slice(0, 5); // Limit to 5 suggestions
            setSuggestions(filtered);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (city) => {
        setSearchText(city.name);
        setIsOpen(false);
        onLocationSelect(`${city.lat},${city.lon}`);
    };

    return (
        <div className="relative w-full sm:w-64">
            <input
                type="text"
                placeholder="Search for a city..."
                className="p-3 border border-gray-300 rounded-lg w-full bg-white/80 backdrop-blur-sm"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchText.trim().length > 1 && setIsOpen(true)}
            />
            {isOpen && suggestions.length > 0 && (
                <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto z-50">
                    {suggestions.map((city, index) => (
                        <button
                            key={`${city.name}-${index}`}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex flex-col"
                            onClick={() => handleSelect(city)}
                        >
                            <span className="font-medium">{city.name}</span>
                            <span className="text-sm text-gray-600">{city.country}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const WeatherApp = () => {
    const [city, setCity] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [unit, setUnit] = useState("C"); // C for Celsius, F for Fahrenheit
    const [selectedDay, setSelectedDay] = useState(null);
    const [savedLocations, setSavedLocations] = useState(() => {
        const saved = localStorage.getItem('savedLocations');
        return saved ? JSON.parse(saved) : [];
    });
    const [showAllLocations, setShowAllLocations] = useState(false);

    const fetchWeather = async (query) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `https://api.weatherapi.com/v1/forecast.json?key=${import.meta.env.VITE_APP_WEATHER_API_KEY}&q=${query}&days=7`
            );
            setWeatherData(response.data);
            setError("");
        } catch (err) {
            setError("Location not found. Please try again.");
            setWeatherData(null);
        } finally {
            setLoading(false);
        }
    };

    // Save locations to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    }, [savedLocations]);

    const saveLocation = () => {
        if (weatherData && !savedLocations.some(loc => loc.name === weatherData.location.name)) {
            setSavedLocations([...savedLocations, {
                name: weatherData.location.name,
                lat: weatherData.location.lat,
                lon: weatherData.location.lon
            }]);
        }
    };

    const removeLocation = (locationName) => {
        setSavedLocations(savedLocations.filter(loc => loc.name !== locationName));
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeather(`${latitude},${longitude}`);
                },
                (err) => {
                    console.log(err);
                    setError("Unable to get your location. Please enter a city manually.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser. Please enter a city manually.");
        }
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const handleSearch = () => {
        if (city.trim()) {
            fetchWeather(city);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const convertTemp = (celsius) => {
        return unit === "C" ? celsius : (celsius * 9/5) + 32;
    };

    useEffect(() => {
        return monitorForElements({
            onDrop({ source, location }) {
                const destination = location.current.dropTargets[0];
                if (!destination?.data?.type === 'locations-container') {
                    return;
                }

                const sourceLocation = source.data.location;
                if (!sourceLocation) return;

                // Reorder the locations
                const newLocations = [...savedLocations];
                const draggedItemIndex = newLocations.findIndex(
                    loc => loc.name === sourceLocation.name
                );
                
                if (draggedItemIndex === -1) return;

                const item = newLocations[draggedItemIndex];
                newLocations.splice(draggedItemIndex, 1);
                
                // Calculate the drop position based on mouse position
                const dropIndex = Math.min(
                    newLocations.length,
                    Math.floor((location.current.input.clientX - destination.element.getBoundingClientRect().left) / 100)
                );
                
                newLocations.splice(dropIndex, 0, item);
                setSavedLocations(newLocations);
            },
        });
    }, [savedLocations]);

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?q=80&w=2074&auto=format&fit=crop')" }}
        >
            <div className="flex flex-col items-center justify-center min-h-screen backdrop-blur-sm bg-black/30">
                <div className="w-full max-w-4xl p-3 sm:p-6 rounded-lg mx-2">
                    <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-white text-center">Weather Forecast</h1>
                    
                    {/* Search Section */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center mb-4 sm:mb-8">
                        <SearchBox onLocationSelect={fetchWeather} />
                        <button
                            onClick={() => setUnit(unit === "C" ? "F" : "C")}
                            className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors duration-200"
                        >
                            °{unit === "C" ? "F" : "C"}
                        </button>
                    </div>

                    {/* Saved Locations */}
                    {savedLocations.length > 0 && (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl text-white">Saved Locations</h2>
                                {savedLocations.length > 20 && (
                                    <button
                                        onClick={() => setShowAllLocations(!showAllLocations)}
                                        className="text-sm text-white/80 hover:text-white transition-colors duration-200"
                                    >
                                        {showAllLocations ? 'Show Less' : 'Show All'}
                                    </button>
                                )}
                            </div>
                            <SavedLocationsContainer>
                                {(showAllLocations ? savedLocations : savedLocations.slice(0, 20)).map((location) => (
                                    <SavedLocationItem
                                        key={location.name}
                                        location={location}
                                        onRemove={removeLocation}
                                        onSelect={(loc) => fetchWeather(`${loc.lat},${loc.lon}`)}
                                    />
                                ))}
                                {!showAllLocations && savedLocations.length > 20 && (
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center">
                                        <span className="text-gray-600">
                                            +{savedLocations.length - 20} more...
                                        </span>
                                    </div>
                                )}
                            </SavedLocationsContainer>
                        </div>
                    )}

                    {error && <p className="text-red-500 mt-4 text-center bg-white/80 rounded-lg p-3 mx-2">{error}</p>}
                    
                    {weatherData && (
                        <div className="space-y-4 sm:space-y-8 animate-fadeIn">
                            {/* Current Weather */}
                            <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl sm:text-3xl font-bold">{weatherData.location.name}</h2>
                                    <button
                                        onClick={saveLocation}
                                        disabled={savedLocations.some(loc => loc.name === weatherData.location.name)}
                                        className={`text-sm px-3 py-1 rounded-lg transition-colors duration-200 ${
                                            savedLocations.some(loc => loc.name === weatherData.location.name)
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                    >
                                        {savedLocations.some(loc => loc.name === weatherData.location.name)
                                            ? 'Saved'
                                            : 'Save Location'}
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <p className="text-4xl sm:text-5xl font-bold">
                                            {Math.round(convertTemp(weatherData.current.temp_c))}°{unit}
                                        </p>
                                        <p className="text-lg sm:text-xl mt-2">{weatherData.current.condition.text}</p>
                                        <div className="mt-4 space-y-1">
                                            <p>Humidity: {weatherData.current.humidity}%</p>
                                            <p>Wind: {weatherData.current.wind_kph} km/h</p>
                                            <p>Feels like: {Math.round(convertTemp(weatherData.current.feelslike_c))}°{unit}</p>
                                        </div>
                                    </div>
                                    <img
                                        src={weatherData.current.condition.icon}
                                        alt="weather icon"
                                        className="w-20 h-20 sm:w-24 sm:h-24 animate-pulse self-center"
                                    />
                                </div>
                            </div>

                            {/* 7-day forecast */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 sm:gap-4">
                                {weatherData.forecast.forecastday.map((day) => (
                                    <div 
                                        key={day.date} 
                                        className={`bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-lg 
                                        transform transition-all duration-300 ease-in-out cursor-pointer
                                        hover:scale-105 hover:shadow-xl hover:bg-white/90
                                        ${selectedDay === day.date ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                                        onClick={() => setSelectedDay(selectedDay === day.date ? null : day.date)}
                                    >
                                        <p className="font-semibold text-sm sm:text-base">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <img
                                            src={day.day.condition.icon}
                                            alt="forecast icon"
                                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                                        />
                                        <div className="text-center">
                                            <p className="font-bold text-sm sm:text-base">{Math.round(convertTemp(day.day.maxtemp_c))}°{unit}</p>
                                            <p className="text-gray-600 text-sm">{Math.round(convertTemp(day.day.mintemp_c))}°{unit}</p>
                                        </div>
                                        {selectedDay === day.date && (
                                            <div className="mt-2 text-xs sm:text-sm border-t pt-2 animate-fadeIn">
                                                <p>Humidity: {day.day.avghumidity}%</p>
                                                <p>Rain Chance: {day.day.daily_chance_of_rain}%</p>
                                                <p className="text-xs">{day.day.condition.text}</p>
                                            </div>
                                        )}
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

const SavedLocationItem = ({ location, onRemove, onSelect }) => {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        return draggable({
            element: el,
            getInitialData: () => ({ location }),
            onDragStart: () => setIsDragging(true),
            onDrop: () => setIsDragging(false),
        });
    }, [location]);

    return (
        <div 
            ref={ref}
            className={`bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 group cursor-move
                ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
            <button
                onClick={() => onSelect(location)}
                className="text-blue-600 hover:text-blue-800"
            >
                {location.name}
            </button>
            <button
                onClick={() => onRemove(location.name)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
            >
                ×
            </button>
        </div>
    );
};

const SavedLocationsContainer = ({ children }) => {
    const ref = useRef(null);
    const [isDraggedOver, setIsDraggedOver] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        return dropTargetForElements({
            element: el,
            getData: () => ({ type: 'locations-container' }),
            onDragEnter: () => setIsDraggedOver(true),
            onDragLeave: () => setIsDraggedOver(false),
            onDrop: () => setIsDraggedOver(false),
        });
    }, []);

    return (
        <div 
            ref={ref}
            className={`flex flex-wrap gap-2 p-2 rounded-lg transition-colors
                ${isDraggedOver ? 'bg-blue-100/20' : ''}`}
        >
            {children}
        </div>
    );
};

export default WeatherApp;
