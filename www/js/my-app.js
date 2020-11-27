// If we need to use custom DOM library, let's save it to $$ variable:
var usuarioEstaLogeado, userMail, userName;
var db = firebase.firestore();
var storage = firebase.storage();
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
        { path: "/register/", url: "registro.html" },
        {
            path: "/addContacto/",
            url: "addContacto.html",
        },
        { path: "/contacto/:userId", url: "contacto.html" },
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
$$(document).on("page:init", function () {
    // Do something here when page loaded and initialized
});

$$(document).on("page:init", '.page[data-name="index"]', function () {
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
                //var errorCode = error.code;
                var errorMessage = error.message;
                app.dialog.alert(errorMessage, "Error");
            });
    });
});

$$(document).on("page:init", '.page[data-name="registro"]', function () {
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
                    //var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(errorMessage);
                });
        } else {
            app.dialog.alert("Error", "Las contraseñas deben coincidir");
        }
    });
});
$$(document).on("page:init", '.page[data-name="main"]', function () {
    getContactos();
});

$$(document).on("page:init", '.page[data-name="addContacto"]', function () {
    $$("#btnAddContacto").on("click", function () {
        var contactMail = $$("#contactMail").val();
        console.log(contactMail);
        db.collection("USUARIOS")
            .doc(contactMail)
            .get()
            .then(function (doc) {
                console.log(doc.data());
                if (doc.exists) {
                    db.collection("USUARIOS")
                        .doc(contactMail)
                        .collection("CONTACTOS")
                        .doc(userMail)
                        .set({ nombre: userName });
                    db.collection("USUARIOS")
                        .doc(userMail)
                        .collection("CONTACTOS")
                        .doc(doc.id)
                        .set({ nombre: doc.data().nombre });
                    app.dialog.alert(
                        "El usuario se ha agregado de forma correcta"
                    );
                    router.refreshPage();
                } else {
                    app.dialog.alert("El usuario no existe");
                }
            })
            .catch(function () {});
    });
});
$$(document).on("page:init", '.page[data-name="contacto"]', function () {
    var contactId = router.currentRoute.params.userId;
    console.log(contactId);
    db.collection("USUARIOS")
        .doc(contactId)
        .get()
        .then(function (doc) {
            contactName = doc.data().nombre;
            $$(".contactId").text(contactId);
            $$(".contactName").text(contactName);
        });
    $$("#archivos").on("change", function () {
        files = document.getElementById("archivos").files;
        mostrarArchivos(files);
    });
    $$("#btnTransaccion").on("click", function () {
        var archivos = document.getElementById("archivos").files;
        db.collection('TRANSACCIONES').add({
            emisor: userMail,
            receptor: contactId,
            cantidad: archivos.length
        }).then(function(docRef){
            var storageRef = storage.ref(docRef.id);
            Array.from(archivos).forEach((archivo) => {
                var filerRef = storageRef.child(archivo.name);
                filerRef.put(archivo);
        })
    });
});
//$$(document).on("page:init", '.page[data-name="about"]', function (e) {});

function getUsuario() {
    userMail = localStorage.getItem("userMail");
    userName = localStorage.getItem("userName");
    if (userMail != null) {
        usuarioEstaLogeado = true;
    } else {
        usuarioEstaLogeado = false;
    }
}
function setUsuario(mail) {
    userMail = mail;
    db.collection("USUARIOS")
        .doc(userMail)
        .get()
        .then(function (doc) {
            userName = doc.data().nombre;
        });
    localStorage.setItem("userMail", userMail);
    localStorage.setItem("userName", userName);
    usuarioEstaLogeado = true;
}

function crearUsuario(email, nombre) {
    db.collection("USUARIOS")
        .doc(email)
        .set({ nombre: nombre, CONTACTOS: {} })
        .catch(function (error) {
            app.dialog.alert("Error al crear el usuario");
            console.log(error);
        });
}
function getContactos() {
    db.collection("USUARIOS")
        .doc(userMail)
        .collection("CONTACTOS")
        .get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                console.log(doc.id + " => " + doc.data());
                $$("#listaDeContacto").append(
                    '<li><a href="/contacto/' +
                        doc.id +
                        '">' +
                        doc.data().nombre +
                        "</a></li>"
                );
            });
        });
}
function mostrarArchivos(files) {
    Array.from(files).forEach((archivo) => {
        $$("#fileList").append("<li>" + archivo.name + "</li>");
    });
}
