// If we need to use custom DOM library, let's save it to $$ variable:
var usuarioEstaLogeado, usuario;
var db = firebase.firestore();
var data = {
    nombre: "usuario 1",
    DISPOSITIVOS: ["Mi pc"],
    CONTACTOS: [],
};

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
            path: "/main/",
            url: "main.html",
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
    getUsuario();
    //if (usuarioEstaLogeado == true) {
    //    router.navigate("/main/");
    //}
});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on("page:init", function (e) {
    // Do something here when page loaded and initialized
});

$$(document).on("page:init", '.page[data-name="index"]', function (e) {
    $$("#btnLogin").on("click", function () {
        var email = $$("#emailLogin").val();
        var password = $$("#passwordLogin").val();
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then(function () {
                setUsuario(email);
                router.navigate("/main/");
            })
            .catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                app.dialog.alert(errorMessage, "Error");
            });
    });
});

$$(document).on("page:init", '.page[data-name="registro"]', function (e) {
    $$("#btnRegistro").on("click", function () {
        var email = $$("#emailRegistro").val();
        var nombre = $$("#nombreRegistro").val();
        var password = $$("#passwordRegistro").val();
        var confirmPassword = $$("#confirmPasswordRegistro").val();
        if (password == confirmPassword) {
            firebase
                .auth()
                .createUserWithEmailAndPassword(email, password)
                .then(function () {
                    crearUsuario(email, nombre);
                    setUsuario(email);
                    router.navigate("/main/");
                })
                .catch(function (error) {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(errorMessage);
                });
        } else {
            app.dialog.alert("Error", "Las contraseñas deben coincidir");
        }
    });
});
$$(document).on("page:init", '.page[data-name="main"]', function (e) {
    //Acceder a la lista de contactos

});

$$(document).on("page:init", '.page[data-name="about"]', function (e) {});

function getUsuario() {
    usuario = localStorage.getItem("usuario");
    if (usuario != null) {
        usuarioEstaLogeado = true;
    } else {
        usuarioEstaLogeado = false;
    }
}
function setUsuario(nombre) {
    localStorage.setItem("usuario", nombre);
    usuario = nombre;
    usuarioEstaLogeado = true;
}

function crearUsuario(email, nombre) {
    db.collection("USUARIOS")
        .doc(email)
        .set({ nombre: nombre,CONTACTOS:[] })
        .catch(function (error) {
            app.dialog.alert("Error al crear el usuario");
            console.log(error);
        });
}
