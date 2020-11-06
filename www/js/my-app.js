// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var app = new Framework7({
    // App root element
    root: "#app",
    // App Name
    name: "My App",
    // App id
    id: "com.myapp.test",
    // Enable swipe panel
    panel: {
        swipe: "left",
    },
    // Add default routes
    routes: [
        {
            path: "/login/",
            url: "login.html",
        },
        {
            path: "/register/",
            url: "registro.html",
        },
    ],
    // ... other parameters
});

var mainView = app.views.create(".view-main");
var router = mainView.router;

// Handle Cordova Device Ready Event
$$(document).on("deviceready", function () {
    console.log("Device is ready!");
});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on("page:init", function (e) {
    // Do something here when page loaded and initialized
    console.log(e);
});

$$(document).on("page:init", '.page[data-name="login"]', function (e) {
    $$("#btnLogin").on("click", function () {
        var email = $$("#email").val();
        var password = $$("#password").val();
        console.log(password);
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then(function(){

            })
            .catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorMessage);
            });
    });
});

$$(document).on("page:init", '.page[data-name="registro"]', function (e) {
    $$("#btnRegistro").on("click", function () {
        var email = $$("#email").val();
        var password = $$("#password").val();
        var confirmPassword = $$("#confirmPassword").val();
        if (password == confirmPassword) {
            firebase
                .auth()
                .createUserWithEmailAndPassword(email, password)
                .catch(function (error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(errorMessage);
                });
        }
    });
});

$$(document).on("page:init", '.page[data-name="about"]', function (e) {
    // Do something here when page with data-name="about" attribute loaded and initialized
    console.log(e);
    alert("Hello");
});
