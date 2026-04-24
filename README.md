# Nexus Prototype

A React Native tenant services platform built as a demonstration 
prototype.

## What it demonstrates

- NLP-driven repair request classification using Housing Association's actual 
  urgency categories (Critical / Emergency / Urgent / Routine)
- Multi-lingual support — responds in the user's language (tested: 
  Urdu, Somali, Welsh, English)
- Repair submission to MongoDB via Node.js/Express API
- Real-time status dashboard with pull-to-refresh

## Architecture

React Native (Expo) → Express/Node.js API (Render) → MongoDB Atlas  
LLM: Groq llama-3.3-70b-versatile

## Live demo

Scan with Expo Go: ![alt text](image-1.png)

## Stack

React Native · Expo Router · TypeScript · Zustand · NativeWind  
Node.js · Express · MongoDB Atlas · Mongoose · Groq SDK
