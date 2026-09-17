# headsup-study

Soon to be series of multiple party games centered around studying
# Stack
ReactNative  
Expo 
Python
FastAPI
Anthropic API
full-stack mobile app with React Native frontend and FastAPI backend served over a live IP
Integrated Anthropic API to auto-generate flashcards from user-inputted vocab terms
Implemented accelerometer-based tilt controls and real-time game logic for interactive study sessions

[architecture.md](https://github.com/user-attachments/files/32344676/architecture.md)
```mermaid
flowchart TB
    subgraph client["Expo Mobile Client"]
        direction TB
        runtime{{"Expo / React Native<br/>mobile runtime<br/>[app.json]"}}
        haptic["Haptic Tabs & Theme<br/>platform UI<br/>[haptic-tab.tsx]"]
        shell["App Shell<br/>router layout<br/>[_layout.tsx]"]
        tabnav["Tab Navigation<br/>router layout<br/>[_layout.tsx]"]
        themed["Themed UI<br/>component layer<br/>[themed-view.tsx]"]
        settings["Settings<br/>screen<br/>[settings.tsx]"]
        studysets["Study Sets<br/>screens<br/>[my-sets.tsx]"]
        game["Game Screen<br/>[game.tsx]"]
        engine["Card Game Engine<br/>React hook<br/>[use-card-game.ts]"]
        results["Results<br/>screen<br/>[results.tsx]"]
        review["Card Review<br/>screen<br/>[review.tsx]"]

        runtime -- hosts --> shell
        runtime -- supports --> haptic
        haptic -- supports --> tabnav
        shell -- loads --> tabnav
        tabnav -- "navigates to" --> settings
        tabnav -- "navigates to" --> studysets
        themed -- "renders in" --> game
        studysets -- "starts session" --> game
        game -- uses --> engine
        engine -- "completes to" --> results
        results -- opens --> review
    end

    subgraph service["Generation Service"]
        direction TB
        api["FastAPI API<br/>HTTP service<br/>[main.py]"]
        aiadapter["AI Generation<br/>provider adapter<br/>[ai.py]"]
        parser["Card Parser<br/>response parser<br/>[parser.py]"]

        api -- "delegates generation" --> aiadapter
        aiadapter -- "passes model output" --> parser
        parser -- "returns card structures" --> api
    end

    anthropic{{"Anthropic API<br/>external AI"}}

    game -- "requests generated cards" --> api
    api -- "returns cards" --> game
    aiadapter -- invokes --> anthropic

    classDef client fill:#cfe2ff,stroke:#4d7ea8,color:#000;
    classDef service fill:#ffe8b3,stroke:#c9932f,color:#000;
    classDef external fill:#e6f0ff,stroke:#4d7ea8,color:#000;

    class runtime,haptic,shell,tabnav,themed,settings,studysets,game,engine,results,review client;
    class api,aiadapter,parser service;
    class anthropic external;
```
