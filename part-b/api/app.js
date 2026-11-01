const express = require("express");
const os = require("os");

// Create Express application
const app = express();

// Server configuration
const PORT = 3000;

// Fortune messages
const fortunes = [
    "V2: Your next adventure will be amazing.",
    "V2: Success is closer than you think.",
    "V2: Great opportunities are coming your way.",
    "V2: Believe in yourself and keep moving forward.",
    "V2: Today is the beginning of something wonderful.",
    "V2: Your hard work will soon pay off.",
    "V2: A surprising opportunity awaits you.",
    "V2: Happiness grows when you share it.",
    "V2: Never stop learning and exploring.",
    "V2: The best chapters of your story are ahead."
];

// Fortune API endpoint
app.get("/api/fortune", (req, res) => {

    // Select a random fortune
    const randomIndex = Math.floor(Math.random() * fortunes.length);
    const fortune = fortunes[randomIndex];

    // Get Pod hostname and application version
    const pod = os.hostname();
    const version = process.env.APP_VERSION || "dev";

    // Return JSON response
    res.json({
        fortune: fortune,
        pod: pod,
        version: version
    });

});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fortune API listening on port ${PORT}`);
});