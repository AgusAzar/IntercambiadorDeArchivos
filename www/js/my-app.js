// If we need to use custom DOM library, let's save it to $$ variable:
var usuarioEstaLogeado, userMail, userName;
var db = firebase.firestore();
var files = [];
var storage = firebase.storage();
var lastTimeStamp = 0;
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
    /*panel: {
        swipe: "left",
    },
    */
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
        {
            path: "/addContacto/",
            url: "addContacto.html",
        },
        {
            path: "/contacto/:userId/:userName",
            url: "contacto.html",
        },
        {
            path: "/transaccion/:transaccionId",
            url: "transaccion.html",
        },
    ],
    // ... other parameters
});

var mainView = app.views.create(".view-main");
var router = mainView.router;

// Handle Cordova Device Ready Event
$$(document).on("deviceready", function () {
    /*if(usuarioEstaLogeado){
        router.navigate('/main/')
    }
    */
});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on("page:init", function () {
    // Do something here when page loaded and initialized
});

$$(document).on("page:init", '.page[data-name="index"]', function () {
    $$("#btnLogin").on("click", async function () {
        var email = $$("#emailLogin").val();
        var password = $$("#passwordLogin").val();
        app.dialog.preloader();
        var loged = await login(email,password);
        if(loged == 'loged'){
            console.log(loged)
            app.dialog.close()
            router.navigate("/main/");
        }
        else{
            app.dialog.close()
            var errorMessage = loged;
            app.dialog.alert(errorMessage, "Error");
        }

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
                    setUsuario(email,nombre);
                    router.navigate("/main/");
                })
                .catch(function (error) {
                    //var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(errorMessage);
                    app.dialog.alert(errorMessage, "Error");
                });
        } else {
            app.dialog.alert("Error", "Las contraseñas deben coincidir");
        }
    });
});
$$(document).on("page:init", '.page[data-name="main"]', function () {
    getContactos();
    getTransacciones();
    $$('#btnNotificaciones').on('click',function(){
        console.log('abierto')
        $$('#badge').removeClass('badge')
    })
    $$('#logout').on('click',function(){
        logout();
        router.back();
    })
});

$$(document).on("page:init", '.page[data-name="addContacto"]', function () {
    var qrcode = new QRCode(document.getElementById("qrCode"))
    qrcode.makeCode(userMail);
    $$("#scanQR").on("click",function(){
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                addContacto(result.text);
                /*alert("We got a barcode\n" +
                    "Result: " + result.text + "\n" +
                    "Format: " + result.format + "\n" +
                    "Cancelled: " + result.cancelled);
                    */
            },
            function (error) {
                app.dialog.alert("Scanning failed: " + error);
            }
        );
    })
    $$("#btnAddContacto").on("click", function () {
        var contactMail = $$("#contactMail").val();
        console.log(contactMail);
        addContacto(contactMail);
        /*var doc = getUserData(contactMail)
        if (doc.exists) {
            db.collection("USUARIOS") .doc(contactMail) .collection("CONTACTOS") .doc(userMail) .set({ nombre: userName });
            db.collection("USUARIOS") .doc(userMail) .collection("CONTACTOS") .doc(doc.id) .set({ nombre: doc.data().nombre });
            app.dialog.alert(
                "El usuario se ha agregado de forma correcta"
            );
            router.back();
        } else {
            app.dialog.alert("El usuario no existe");
        }
        */
    });
});
$$(document).on("page:init", '.page[data-name="contacto"]', function () {
    var contactId = router.currentRoute.params.userId;
    var contactName = router.currentRoute.params.userName;
    console.log(contactId);
    $$(".contactId").text(contactId);
    $$(".contactName").text(contactName);
    $$("#archivos").on("change", function () {
        Array.from(document.getElementById("archivos").files).forEach((archivo)=>{
            files.push(archivo);
        })
        mostrarArchivos();
    });
    $$("#btnTransaccion").on("click", function () {
        if(files.length > 0){
            app.dialog.preloader("Subiendo archivos");
            var archivos = document.getElementById("archivos").files;
            db.collection("TRANSACCIONES")
                .add({
                    usuarios: [userMail, contactId],
                    cantidad: archivos.length,
                    timeStamp: Date.now(),
                })
                .then(function (docRef) {
                    var storageRef = storage.ref(docRef.id);
                    var cantidadSubidos = 0;
                    files.forEach((archivo) => {
                        var filerRef = storageRef.child(archivo.name);
                        filerRef.put(archivo).then(function () {
                            cantidadSubidos++;
                            if (cantidadSubidos == archivos.length) {
                                app.dialog.close();
                                router.back();
                            } else {
                                console.log(cantidadSubidos);
                            }
                        });
                    });
                });
        }
    });
});
$$(document).on("page:init", '.page[data-name="transaccion"]', function () {
    var transaccionId = router.currentRoute.params.transaccionId;
    /*$$(".fileId").on("click", function () {
        var url = $$(this).attr("id");
        downloadFile(url);
    });*/
    console.log(transaccionId);
    var ref = storage.ref(transaccionId);
    ref.listAll().then(function (res) {
        res.items.forEach(function (itemRef) {
            console.log(itemRef);
            itemRef.getDownloadURL().then(function (url) {
                console.log(url);
                $$("#fileList").append(
                    `<li><div class="item-content"><div class="item-inner"> <div class="item-title">` +
                    itemRef.name +
                    `</div> <a id="` +
                    url +
                    `" href="#" onclick="downloadFile('` +
                    itemRef.name +
                    `',this.id)" class="fileId f7-icons size-50">arrow_down_circle</a> </div> </div></li>`
                );
            });
        });
    });
});
//$$(document).on("page:init", '.page[data-name="about"]', function (e) {});
function login(email,password){
    return new Promise((resolve)=>{
        console.log(email,'  ',password)
        firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then(async function () {
                console.log('login ok')
                var doc = await getUserData(email);
                setUsuario(email,doc.data().nombre);
                resolve('loged');
            })
            .catch(function (error) {
                console.log('login bad')
                resolve(error);
            });

    })
}
function logout(){
    firebase.auth().signOut();
    userMail = '';
    userName = '';
}
/*function getUsuario() {
    userMail = localStorage.getItem("userMail");
    userName = localStorage.getItem("userName");
    usuarioEstaLogeado = localStorage.getItem("usuarioEstaLogeado");
}*/
function setUsuario(mail,name) {
    userMail = mail;
    userName = name;
}
function getUserData(userid){
    return new Promise((resolve)=>{
        db.collection("USUARIOS")
            .doc(userid)
            .get()
            .then(function(doc){
                resolve(doc);
            })
    })
}
function crearUsuario(email, nombre) {
    db.collection("USUARIOS")
        .doc(email)
        .set({ nombre: nombre, CONTACTOS: {} })
        .catch(function (error) {
            app.dialog.alert("Error al crear el usuario");
            app.dialog.alert(error, "Error");
        });
}
function getContactos() {
    db.collection("USUARIOS")
        .doc(userMail)
        .collection("CONTACTOS")
        .onSnapshot(function (querySnapshot) {
            querySnapshot.docChanges().forEach(function (change) {
                doc = change.doc;
                console.log(doc);
                console.log(doc.id + " => " + doc.data());
                $$("#listaDeContacto").prepend(
                    '<li><a class="contacto" href="/contacto/' + doc.id + "/" + doc.data().nombre + '">' + doc.data().nombre + "</a></li>"
                );
            });
        });
}
async function addContacto(contactMail){
    console.log(contactMail);
    var doc = await getUserData(contactMail)
    if (doc.exists) {
        db.collection("USUARIOS") .doc(contactMail) .collection("CONTACTOS") .doc(userMail) .set({ nombre: userName });
        db.collection("USUARIOS") .doc(userMail) .collection("CONTACTOS") .doc(doc.id) .set({ nombre: doc.data().nombre });
        app.dialog.alert(
            "El usuario se ha agregado de forma correcta"
        );
        router.back();
    } else {
        app.dialog.alert("El usuario no existe");
    }
}
function mostrarArchivos() {
    $$("#fileList").html('');
    files.forEach((archivo) => {
        $$("#fileList").append(
            `<li><div class="item-content"><div class="item-inner"> <div class="item-title">` +
            archivo.name +
            `</div> <a id="`+archivo.name+`" onclick="deleteFile('`+archivo.name+`')" class="fileId f7-icons size-50"> xmark_circle </a> </div> </div></li>`
        );
    });
}
function deleteFile(archivo){
    console.log(archivo)
    files = files.filter(function(file){
        return file.name != archivo
    })
    mostrarArchivos()
}
function downloadFile(name, url) {
    if(device.platform != 'browser'){
        app.dialog.preloader('Descargando archivo')
        console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.onload = function () {
            if (this.status == 200) {
                var blob = xhr.response;
                //blob tiene el contenido de la respuesta del servidor
                saveFile(name, blob);
            }
        };
        xhr.send();
    } else {
        window.open(url,'_system');
    }
}
function saveFile(name, blob) {
    window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, function (fs) {
        //abrimos el sistema de archivos
        console.log("file system open: " + fs.name);
        window.resolveLocalFileSystemURL( cordova.file.externalRootDirectory, function (dirEntry) {
            //vamos a la raiz del sistema '/'
            console.log("root ", dirEntry);
            dirEntry.getDirectory( "Download", { create: true, exclusive: false }, function (dirEntry) {
                //vamos a la carpeta download
                console.log("downloads ", dirEntry);
                dirEntry.getFile( name, { create: true, exclusive: false }, function (fileEntry) {
                    writeFile(fileEntry, blob);
                    //llamamos a la function writeFile y le pasamos el archivo a guardar
                }, function (err) {
                    app.dialog.alert( "Error al descargar el archivo");
                    console.log("failed to create file");
                    console.log(err);
                }
                );
            }, function () {
                app.dialog.alert( "Error al descargar el archivo");
                console.log(err);
            }
            );
        }, function () {
            app.dialog.close();
            app.dialog.alert("Error al descargar el archivo");
        }
        );
    }, function (err) {
        app.dialog.alert("Error al descargar el archivo");
        console.log(err);
    }
    );
}
function writeFile(fileEntry, dataObj) {
    fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function () {
            console.log("Successful file write...");
            console.log('type '+dataObj.type)
            cordova.plugins.fileOpener2.open(fileEntry.toURL(),dataObj.type);
            app.dialog.close();
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
            app.dialog.close();
            app.dialog.alert("Error al descargar el archivo");
        };


        fileWriter.write(dataObj);
    });
}
async function getTransacciones() {
    db.collection("TRANSACCIONES")
        .where("usuarios", "array-contains", userMail)
        .limit(50)
        .onSnapshot(async function (querySnapshot) {
            $$('#badge').addClass('badge')
            lastTimeStamp = Date.now();
            var docs = querySnapshot.docChanges();
            docs.sort(function (a, b) {
                if (a.doc.data().timeStamp > b.doc.data().timeStamp) return 1;
                if (a.doc.data().timeStamp < b.doc.data().timeStamp) return -1;
                return 0;
            });
            console.log(docs);
            docs.forEach(async function (change) {
                doc = change.doc;
                console.log(
                    "leyendo datos de:" +
                    doc.data().usuarios[0] +
                    " a " +
                    doc.data().usuarios[1]
                );
                var transaccionId = doc.id;
                $$("#lista-notificaciones").prepend(
                    "<li><a id='" +
                    transaccionId +
                    "' class='panel-close' href='/transaccion/" +
                    transaccionId +
                    "'></li>"
                );
                if (doc.data().usuarios[0] == userMail) {
                    var id = doc.data().usuarios[1];
                    var doc = await getUserData(id);
                    var contactName = doc.data().nombre;
                    $$("#" + transaccionId).text("De ti a " + contactName);
                } else {
                    var id = doc.data().usuarios[0]; var doc = await getUserData(id);
                    var contactName = doc.data().nombre;
                    $$("#" + transaccionId).text("De " + contactName + " a ti");
                }
            });
        });
}
