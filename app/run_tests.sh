#!/bin/bash

BASE_URL="http://localhost:5050/test/irrigation-agent"

echo "------------------------------------------------"
echo "CASE 1: Rain Expected (next 5 days rain >= 10mm)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "input": {"pincode": 452001, "cropType": "cotton", "cropStage": "flowering", "last_irrigation_days_ago": 10},
  "mockWeather": {"daily": [{"dt": 1, "rain": 0}, {"dt": 2, "rain": 12}, {"dt": 3, "rain": 0}, {"dt": 4, "rain": 0}, {"dt": 5, "rain": 0}, {"dt": 6, "rain": 0}, {"dt": 7, "rain": 0}, {"dt": 8, "rain": 0}]}
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 2: Sufficient Recent Rainfall (last 7 days >= threshold)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "input": {"pincode": 452001, "cropType": "soybean", "cropStage": "flowering", "last_irrigation_days_ago": 10},
  "mockWeather": {"daily": [{"dt": 1, "rain": 30}, {"dt": 2, "rain": 0}, {"dt": 3, "rain": 0}, {"dt": 4, "rain": 0}, {"dt": 5, "rain": 0}, {"dt": 6, "rain": 0}, {"dt": 7, "rain": 0}, {"dt": 8, "rain": 0}]}
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 3: Recent Irrigation (last_irrigation_days_ago < 4)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "input": {"pincode": 452001, "cropType": "cotton", "cropStage": "boll_formation", "last_irrigation_days_ago": 2},
  "mockWeather": {"daily": [{"dt": 1, "rain": 0}, {"dt": 2, "rain": 0}, {"dt": 3, "rain": 0}, {"dt": 4, "rain": 0}, {"dt": 5, "rain": 0}, {"dt": 6, "rain": 0}, {"dt": 7, "rain": 0}, {"dt": 8, "rain": 0}]}
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 4: Default - IRRIGATE"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "input": {"pincode": 452001, "cropType": "cotton", "cropStage": "boll_formation", "last_irrigation_days_ago": 6},
  "mockWeather": {"daily": [{"dt": 1, "rain": 0}, {"dt": 2, "rain": 0}, {"dt": 3, "rain": 0}, {"dt": 4, "rain": 0}, {"dt": 5, "rain": 0}, {"dt": 6, "rain": 0}, {"dt": 7, "rain": 0}, {"dt": 8, "rain": 0}]}
}' | json_pp || echo "Failed"
