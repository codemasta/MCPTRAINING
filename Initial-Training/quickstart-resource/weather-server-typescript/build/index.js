import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";
// OpenWeatherMap API - you'll need to get a free API key from https://openweathermap.org/api
const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
// Helper function for making NWS API requests
async function makeNWSRequest(url) {
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
// Helper function for making OpenWeatherMap API requests
async function makeOpenWeatherRequest(endpoint, params) {
    if (!OPENWEATHER_API_KEY) {
        console.error("OpenWeatherMap API key not provided");
        return null;
    }
    const url = new URL(`${OPENWEATHER_API_BASE}/${endpoint}`);
    url.searchParams.append("appid", OPENWEATHER_API_KEY);
    url.searchParams.append("units", "metric"); // Use metric units
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making OpenWeatherMap request:", error);
        return null;
    }
}
// Format alert data
function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
// Create server instance
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
});
// Register weather tools
server.tool("get-alerts", "Get weather alerts for a state", {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
}, async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest(alertsUrl);
    if (!alertsData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve alerts data",
                },
            ],
        };
    }
    const features = alertsData.features || [];
    if (features.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `No active alerts for ${stateCode}`,
                },
            ],
        };
    }
    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: alertsText,
            },
        ],
    };
});
server.tool("get-forecast", "Get weather forecast for a location", {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
}, async ({ latitude, longitude }) => {
    // Get grid point data
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest(pointsUrl);
    if (!pointsData) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
                },
            ],
        };
    }
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to get forecast URL from grid point data",
                },
            ],
        };
    }
    // Get forecast data
    const forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve forecast data",
                },
            ],
        };
    }
    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No forecast periods available",
                },
            ],
        };
    }
    // Format forecast periods
    const formattedForecast = periods.map((period) => [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
    ].join("\n"));
    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: forecastText,
            },
        ],
    };
});
server.tool("get-current-weather", "Get current weather conditions for a city", {
    city: z.string().describe("City name (e.g. 'Oberhausen', 'New York', 'London')"),
    country: z.string().optional().describe("Country code (e.g. 'DE', 'US', 'GB') - optional for disambiguation"),
}, async ({ city, country }) => {
    // First, get coordinates for the city using geocoding
    const geocodeParams = { q: city };
    if (country) {
        geocodeParams.q += `,${country}`;
    }
    const geocodeData = await makeOpenWeatherRequest("geo/1.0/direct", geocodeParams);
    if (!geocodeData || geocodeData.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `Could not find coordinates for ${city}${country ? `, ${country}` : ""}`,
                },
            ],
        };
    }
    const location = geocodeData[0];
    // Get current weather data
    const weatherParams = {
        lat: location.lat.toString(),
        lon: location.lon.toString(),
    };
    const weatherData = await makeOpenWeatherRequest("weather", weatherParams);
    if (!weatherData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve current weather data",
                },
            ],
        };
    }
    const weatherInfo = [
        `Current weather in ${weatherData.name}, ${weatherData.sys.country}:`,
        "",
        `Temperature: ${Math.round(weatherData.main.temp)}°C (feels like ${Math.round(weatherData.main.feels_like)}°C)`,
        `Conditions: ${weatherData.weather[0].description}`,
        `Humidity: ${weatherData.main.humidity}%`,
        `Pressure: ${weatherData.main.pressure} hPa`,
        `Wind: ${weatherData.wind.speed} m/s${weatherData.wind.deg ? ` from ${weatherData.wind.deg}°` : ""}`,
    ];
    if (weatherData.visibility) {
        weatherInfo.push(`Visibility: ${weatherData.visibility / 1000} km`);
    }
    return {
        content: [
            {
                type: "text",
                text: weatherInfo.join("\n"),
            },
        ],
    };
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
