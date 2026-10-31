const express = require("express");
const os = require("os");

// Create Express application
const app = express();

// Server configuration
const PORT = 3000;

// Fortune messages
const fortunes = [
    "Your greatest adventure is just around the corner.",
    "Small steps lead to big achievements.",
    "Believe in yourself and make things happen.",
    "A new opportunity will soon find its way to you.",
    "Your patience will bring great rewards.",
    "Today is the perfect day to start something new.",
    "Great things take time. Keep going.",
    "Your creativity will open unexpected doors.",
    "A positive attitude creates positive results.",
    "The best is yet to come."
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