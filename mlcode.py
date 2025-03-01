import pandas as pd
import numpy as np
import joblib

data = pd.read_csv("crop_data1.csv")
# data["Water Required (ml)"]=(data["Water Required (ml)"]/100000).round(1)
data["Rainfall (mm)"]=data["Rainfall (mm)"].round(1)
data=data.drop(["Wind Speed (km/h)"],axis=1)
data["Water Level (cm)"]=data["Water Level (cm)"].round(1)
data["Humidity (%)"]=data["Humidity (%)"].round(1)
data["Temperature (°C)"]=data["Temperature (°C)"].round(1)
data["Soil Moisture (%)"]=data["Soil Moisture (%)"].round(1)
data.head(10)

categories = ["Soil Type", "Crop Planted"]

missing_cols = [col for col in categories if col not in data.columns]
if missing_cols:
    raise ValueError(f"Columns not found in DataFrame: {missing_cols}")

df_encoded = pd.get_dummies(data, columns=categories, dtype=int, drop_first=True)

# X=df_encoded.drop(["Water Required (ml)"],axis=1)
# Y=df_encoded["Water Required (ml)"]

X=df_encoded

model = joblib.load('lightgbm_model.pkl')

# Make predictions on test data
predictions = model.predict(X)
final = pd.DataFrame({
    'To water': predictions
})
final['To water']=final['To water'].round()
final.head(15)
final.to_csv("To water.csv",index=False)