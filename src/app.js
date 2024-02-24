var express = require("express");
var app = express();


app.set("view engine", "ejs");

app.use(express.static("./views"))

app.get("/", (req, res) => {
    res.render("home");
});


var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
});
