# 🏀 API REST de Estadísticas de Baloncesto (NBA)

## 📌 Descripción del proyecto

Este proyecto consiste en el diseño e implementación de una **API REST desarrollada en Node.js** que permite gestionar y consultar información relacionada con partidos, jugadores y equipos de baloncesto (NBA), utilizando **MongoDB como base de datos no relacional**.

La API proporciona operaciones CRUD completas, permite realizar consultas avanzadas mediante filtros y paginación, y se integra con una **API externa** para enriquecer los datos almacenados.

---

La temática elegida es el **baloncesto (NBA)**.

La API permite gestionar información histórica de la NBA, incluyendo:

- Equipos  
- Jugadores  
- Partidos  

Esto permite construir un sistema que simula una plataforma de estadísticas deportivas, donde se pueden consultar resultados, rendimiento de jugadores y datos de equipos.

---

## 🗂 Modelo de datos

La base de datos está estructurada en al menos tres colecciones principales:

### 🏟 Teams (Equipos)
Contiene información sobre los equipos de la NBA.

### 🧑‍💼 Players (Jugadores)
Contiene información sobre los jugadores y su relación con los equipos.

### 🏀 Games (Partidos)
Contiene información de los partidos, incluyendo equipos participantes, fecha y resultado.

Las colecciones están relacionadas entre sí mediante identificadores (por ejemplo, `teamId` o `playerId`).

---

## 📦 Dataset

Se utiliza un dataset de baloncesto que contiene miles de registros de:

- Partidos  
- Jugadores  
- Equipos  

Los datos se convierten a formato JSON y se cargan automáticamente en la base de datos mediante un script.

---

👥 Integrantes del grupo

- Víctor Vega Martínez
- Álvaro Íñiguez Disla
- Claudia Erguido Aguilar
- ALejandro Lillo Rodriguez
- Pablo Garay Pérez
- Lorenzo Sanz Trucharte
