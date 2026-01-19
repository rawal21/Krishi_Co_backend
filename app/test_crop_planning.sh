#!/bin/bash

BASE_URL="http://localhost:5050/crop-planning-agent"

echo "------------------------------------------------"
echo "CASE 1: Village MH-LAT-CHAKUR (Medium Black Soil), Kharif, Irrigation: True"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "location": {
    "stateCode": "MH",
    "districtCode": "LAT",
    "villageCode": "MH-LAT-CHAKUR"
  },
  "season": "Kharif",
  "landAcres": 10,
  "irrigation": true,
  "budgetLevel": "medium"
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 2: Village MH-LAT-NILANGA (Deep Black Soil), Kharif, Irrigation: False"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "location": {
    "stateCode": "MH",
    "districtCode": "LAT",
    "villageCode": "MH-LAT-NILANGA"
  },
  "season": "Kharif",
  "landAcres": 10,
  "irrigation": false,
  "budgetLevel": "medium"
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 3: Rabi Season (Expected: Safe plan only, since rules only cover Kharif)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "location": {
    "stateCode": "MH",
    "districtCode": "LAT",
    "villageCode": "MH-LAT-CHAKUR"
  },
  "season": "Rabi",
  "landAcres": 5,
  "irrigation": true,
  "budgetLevel": "high"
}' | json_pp || echo "Failed"

echo -e "\n------------------------------------------------"
echo "CASE 4: Unknown Village (Expected: Error)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "location": {
    "stateCode": "Unknown",
    "districtCode": "Unknown",
    "villageCode": "UNKNOWN-VILLAGE"
  },
  "season": "Kharif",
  "landAcres": 10,
  "irrigation": true,
  "budgetLevel": "low"
}' | json_pp || echo "Failed"
