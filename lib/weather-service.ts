import { UnitSystem } from './run-formatting';

export interface WeatherData {
  temp: number | null;
  emoji: string;
  message: string;
  condition: string;
  isNight: boolean;
}

const GOOD_MESSAGES = [
  "Perfect conditions! Forge your legacy today. ⚡",
  "Ideal weather for a PR strike. Get after it! 🏃‍♂️",
  "The Forge is calling. Excellent time for a run. 🔥",
];

const DEFAULT_MESSAGES = [
  "Ready to run? Let's strike while the iron is hot. 🔨",
  "Another day, another mile. Forge ahead! 🚀",
  "Consistency is the hammer that shapes greatness. ⚡",
];

const NIGHT_MESSAGES = [
  "Strike while the world sleeps. Forge ahead. 🌙",
  "The night is clear. Your legacy doesn't rest. 🌌",
  "Glow like the forge in the darkness. 🔨",
  "Shadow miles count double. Keep striking. ✨",
];

export async function fetchWeather(lat: number, lon: number, units: UnitSystem): Promise<WeatherData> {
  try {
    const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
    // Open-Meteo is a free API that does not require an API key for non-commercial use
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&temperature_unit=${tempUnit}&timezone=auto`
    );
    
    if (!response.ok) throw new Error('Weather fetch failed');
    
    const data = await response.json();
    const current = data.current;

    const temp = Math.round(current.temperature_2m);
    const weatherCode = current.weather_code;
    const isNight = current.is_day === 0;
    const mainCondition = getConditionFromWMO(weatherCode);

    return {
      temp,
      emoji: getWeatherEmoji(weatherCode, isNight),
      message: getRunningAdvice(temp, mainCondition, units, isNight),
      condition: mainCondition,
      isNight,
    };
  } catch (error) {
    // Fallback if API fails or Key is missing
    return {
      temp: null,
      emoji: '🔨',
      message: "Focus on the strike. Forge ahead and crush your goals. ⚡",
      condition: 'Clear',
      isNight: false,
    };
  }
}

/**
 * Maps WMO Weather Codes to Emojis
 * https://open-meteo.com/en/docs
 */
function getWeatherEmoji(code: number, isNight: boolean): string {
  if (code === 0) return isNight ? '🌙' : '☀️'; // Clear sky
  if (code >= 1 && code <= 3) return isNight ? '☁️' : '🌤️'; // Partly cloudy
  if (code === 45 || code === 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 67) return '🌧️'; // Rain/Drizzle
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 82) return '🌧️'; // Showers
  if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
  return '☁️';
}

function getConditionFromWMO(code: number): string {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Clouds';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clear';
}

function getRunningAdvice(temp: number, condition: string, units: UnitSystem, isNight: boolean): string {
  const isMetric = units === 'metric';
  const hotThreshold = isMetric ? 30 : 86;
  const coldThreshold = isMetric ? 0 : 32;
  const perfectMin = isMetric ? 15 : 59;
  const perfectMax = isMetric ? 24 : 75;

  if (condition === 'Thunderstorm' || condition === 'Tornado') {
    return "Severe weather alert. The Forge recommends staying indoors! ⚠️";
  }
  if (condition === 'Fog' || condition === 'Mist' || condition === 'Haze') {
    return "Low visibility. Forge with caution and wear reflective gear. 🌫️";
  }
  if (temp > hotThreshold) {
    return "Heat wave alert! Stay hydrated and consider a treadmill run. 🥵";
  }
  if (temp < coldThreshold) {
    return "Freezing conditions. Layer up before hitting the path. ❄️";
  }
  if (condition === 'Rain' || condition === 'Snow') {
    return "Challenging conditions forge the strongest spirits. Be careful! 🌧️";
  }
  if (isNight && condition === 'Clear') {
    return NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)];
  }
  if (temp >= perfectMin && temp <= perfectMax) {
    return GOOD_MESSAGES[Math.floor(Math.random() * GOOD_MESSAGES.length)];
  }
  return DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)];
}