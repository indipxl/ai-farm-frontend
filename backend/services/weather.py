import urllib.request
import json

def get_current_weather(lat: float, lng: float) -> dict:
    """
    Fetches real-time weather including wind speed and direction 
    from Open-Meteo API. Returns a dict with weather data.
    """
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            current = data.get("current", {})
            return {
                "temperature": current.get("temperature_2m", 0),
                "humidity": current.get("relative_humidity_2m", 0),
                "wind_speed": current.get("wind_speed_10m", 0),
                "wind_direction": current.get("wind_direction_10m", 0)
            }
    except Exception as e:
        print(f"Failed to fetch weather: {e}")
        return {
            "temperature": 28.0,
            "humidity": 80.0,
            "wind_speed": 15.0,
            "wind_direction": 90.0 # Default fallback (East)
        }
