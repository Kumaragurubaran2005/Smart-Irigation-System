from flask import Flask, request, jsonify
import pandas as pd
import joblib
from flask_cors import CORS
import requests
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the trained model
model = joblib.load("lightgbm_model.pkl")

# Define all expected features based on the error message
ALL_FEATURES = [
    'Age of Crop (days)',
    'Rainfall (mm)',
    'Water Level (cm)',
    'Humidity (%)',
    'Temperature (°C)',
    'Soil Moisture (%)',
    'Soil Type_Black Soil',
    'Soil Type_Clay Soil',
    'Soil Type_Red Soil',
    'Soil Type_Sandy Soil',
    'Crop Planted_Maize',
    'Crop Planted_Peanuts',
    'Crop Planted_Rice',
    'Crop Planted_Wheat'
]

# Default values for optional features
DEFAULT_VALUES = {
    'Age of Crop (days)': 30,  # Example default, adjust as needed
    'Soil Type': 'Black Soil',  # Will be one-hot encoded
    'Crop Planted': 'Rice'      # Will be one-hot encoded
}

def get_precipitation(api_key, city="Vellore"):
    """Fetch precipitation data from OpenWeatherMap"""
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        response = requests.get(url)
        response.raise_for_status()
        weather_data = response.json()
        return round(float(weather_data.get("rain", {}).get("1h", 0.0)), 1)
    except Exception as e:
        print(f"Weather API error: {str(e)}")
        return 0.0

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, (np.integer, np.floating)):
        return int(obj) if isinstance(obj, np.integer) else float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get and validate input data
        data = request.get_json()
        
        # Required fields from frontend
        required_fields = {
            "humidity": "Humidity (%)",
            "temperature": "Temperature (°C)",
            "soil_moisture": "Soil Moisture (%)",
            "water_level": "Water Level (cm)"
        }

        # Check for missing required fields
        missing_fields = [field for field in required_fields.keys() if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {missing_fields}",
                "status": "error"
            }), 400

        # Build complete feature dictionary
        features = {
            "Humidity (%)": round(float(data["humidity"]), 1),
            "Temperature (°C)": round(float(data["temperature"]), 1),
            "Soil Moisture (%)": round(float(data["soil_moisture"]), 1),
            "Water Level (cm)": round(float(data["water_level"]), 1),
            "Age of Crop (days)": int(data.get("age_of_crop", DEFAULT_VALUES['Age of Crop (days)'])),
            "Rainfall (mm)": round(get_precipitation("b7da58af55ef8487c781e04a2b072403"), 1),
            "Soil Type": data.get("soil_type", DEFAULT_VALUES['Soil Type']),
            "Crop Planted": data.get("crop_planted", DEFAULT_VALUES['Crop Planted'])
        }

        # Create DataFrame
        df = pd.DataFrame([features])

        # Apply one-hot encoding to categorical features
        df_encoded = pd.get_dummies(df, columns=["Soil Type", "Crop Planted"], dtype=int, drop_first=False)

        # Ensure all expected columns are present with correct values
        for feature in ALL_FEATURES:
            if feature not in df_encoded:
                df_encoded[feature] = 0  # Set missing features to 0

        # Select only the expected columns in the correct order
        df_encoded = df_encoded[ALL_FEATURES]

        # Make prediction
        prediction = model.predict(df_encoded)
        water_required = float(prediction[0]) if prediction.size > 0 else 0.0

        # Print the predicted water requirement to the terminal
        print(f"Predicted Water Requirement: {water_required:.2f} liters")

        # Prepare response
        return jsonify({
            "water_required": water_required,
            "status": "success",
            "message": "Prediction successful"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "water_required": 0.0
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)