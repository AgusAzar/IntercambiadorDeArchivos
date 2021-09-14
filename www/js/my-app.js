// If we need to use custom DOM library, let's save it to $$ variable:
var usuarioEstaLogeado, userMail, userName;
var db = firebase.firestore();
var files = [];
var storage = firebase.storage();
var data = {
    nombre: 'usuario 1',
    DISPOSITIVOS: ['Mi pc'],
    CONTACTOS: [],
};

var $$ = Dom7;

var app = new Framework7({
    // App root element
    root: '#app',
    // App Name
    name: 'Intercambiador de archivos',
    // App id
    id: 'com.intercambiadorDeArchivos.agusAzar',
    // Add default routes
    routes: [
        {
            path: '/main/',
            url: 'main.html',
        },
        {
            path: '/register/',
            url: 'registro.html',
        },
        {
            path: '/addContacto/',
            url: 'addContacto.html',
        },
        {
            path: '/contacto/:userId/:userName',
            url: 'contacto.html',
        },
        {
            path: '/transaccion/:transaccionId',
            url: 'transaccion.html',
        },
    ],
    // ... other parameters
});

var mainView = app.views.create('.view-main');
var router = mainView.router;

// Handle Cordova Device Ready Event
$$(document).on('deviceready', () => {
    firebase.auth().onAuthStateChanged(async (user) => {
        app.dialog.preloader();
        if (user) {
            var doc = await getUserData(user.email);
            setUsuario(user.email, doc.data().nombre);
            router.navigate('/main/');
            app.dialog.close();
        } else {
            app.dialog.close();
        }
    });
});

// Option 1. Using one 'page:init' handler for all pages
$$(document).on('page:init', function () {
    // Do something here when page loaded and initialized
});

$$(document).on('page:init', '.page[data-name="index"]', () => {
    $$('#btnLogin').on('click', () => {
        var email = $$('#emailLogin').val();
        var password = $$('#passwordLogin').val();
        login(email, password);
    });
});

$$(document).on('page:init', '.page[data-name="registro"]', () => {
    $$('#btnRegistro').on('click', () => {
        var email = $$('#emailRegistro').val();
        var nombre = $$('#nombreRegistro').val();
        var password = $$('#passwordRegistro').val();
        var confirmPassword = $$('#confirmPasswordRegistro').val();
        if (password == confirmPassword) {
            firebase
                .auth()
                .createUserWithEmailAndPassword(email, password)
                .then(() => {
                    crearUsuario(email, nombre);
                    setUsuario(email, nombre);
                })
                .catch((error) => {
                    showError(error.message, 'Error');
                });
        } else {
            showError('Error', 'Las contraseñas deben coincidir');
        }
    });
});
$$(document).on('page:init', '.page[data-name="main"]', () => {
    getContactos();
    getTransacciones();
    $$('#btnNotificaciones').on('click', () => {
        console.log('abierto');
        $$('#badge').removeClass('badge');
    });
    $$('#logout').on('click', () => {
        logout();
        router.back();
    });
});

$$(document).on('page:init', '.page[data-name="addContacto"]', () => {
    var qrcode = new QRCode(document.getElementById('qrCode'));
    qrcode.makeCode(userMail);
    $$('#scanQR').on('click', () => {
        $$('html').hide();
        QRScanner.scan((err, text) => {
            if (err) {
                $$('html').show();
            } else {
                $$('html').show();
                addContacto(text);
            }
        });
        QRScanner.show((status) => {
            console.log(status);
        });
    });
    $$('#btnAddContacto').on('click', () => {
        var contactMail = $$('#contactMail').val();
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
$$(document).on('page:init', '.page[data-name="contacto"]', () => {
    var contactId = router.currentRoute.params.userId;
    var contactName = router.currentRoute.params.userName;
    console.log(contactId);
    $$('.contactId').text(contactId);
    $$('.contactName').text(contactName);
    $$('#archivos').on('change', () => {
        Array.from(document.getElementById('archivos').files).forEach(
            (archivo) => {
                files.push(archivo);
            }
        );
        mostrarArchivos();
    });
    $$('#btnTransaccion').on('click', () => {
        if (files.length > 0) {
            app.dialog.preloader('Subiendo archivos');
            var archivos = document.getElementById('archivos').files;
            db.collection('TRANSACCIONES')
                .add({
                    usuarios: [userMail, contactId],
                    cantidad: archivos.length,
                    timeStamp: Date.now(),
                })
                .then((docRef) => {
                    var storageRef = storage.ref(docRef.id);
                    var cantidadSubidos = 0;
                    files.forEach((archivo) => {
                        var filerRef = storageRef.child(archivo.name);
                        filerRef.put(archivo).then(() => {
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
$$(document).on('page:init', '.page[data-name="transaccion"]', () => {
    var transaccionId = router.currentRoute.params.transaccionId;
    /*$$(".fileId").on("click",  ()=> {
        var url = $$(this).attr("id");
        downloadFile(url);
    });*/
    console.log(transaccionId);
    var ref = storage.ref(transaccionId);
    ref.listAll().then((res) => {
        res.items.forEach((itemRef) => {
            console.log(itemRef);
            itemRef.getDownloadURL().then((url) => {
                console.log(url);
                $$('#fileList').append(
                    `<li><div class="item-content"><div class="item-inner"> <div class="item-title">${itemRef.name}</div> <a id="${url}" href="#" onclick="downloadFile('${itemRef.name}',this.id)" class="fileId f7-icons size-50">arrow_down_circle</a> </div> </div></li>`
                );
            });
        });
    });
});
//$$(document).on("page:init", '.page[data-name="about"]', function (e) {});
function login(email, password) {
    firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return firebase.auth().signInWithEmailAndPassword(email, password);
        })
        .then(async () => {
            console.log('login ok');
            var doc = await getUserData(email);
            setUsuario(email, doc.data().nombre);
        })
        .catch((error) => {
            showError(error.message);
        });
}
function logout() {
    firebase.auth().signOut();
    userMail = '';
    userName = '';
}
/*function getUsuario() {
    userMail = localStorage.getItem("userMail");
    userName = localStorage.getItem("userName");
    usuarioEstaLogeado = localStorage.getItem("usuarioEstaLogeado");
}*/
function setUsuario(mail, name) {
    userMail = mail;
    userName = name;
}
function showError(errorMessage) {
    console.log(errorMessage);
    showError(errorMessage, 'Error');
}
function getUserData(userid) {
    return new Promise((resolve) => {
        db.collection('USUARIOS')
            .doc(userid)
            .get()
            .then((doc) => {
                resolve(doc);
            });
    });
}
function crearUsuario(email, nombre) {
    db.collection('USUARIOS')
        .doc(email)
        .set({ nombre: nombre, CONTACTOS: {} })
        .catch(() => {
            showError('Error al crear el usuario');
        });
}
function getContactos() {
    db.collection('USUARIOS')
        .doc(userMail)
        .collection('CONTACTOS')
        .onSnapshot((querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                doc = change.doc;
                console.log(doc);
                console.log(doc.id + ' => ' + doc.data());
                $$('#listaDeContacto').prepend(
                    '<li><a class="contacto" href="/contacto/' +
                        doc.id +
                        '/' +
                        doc.data().nombre +
                        '">' +
                        doc.data().nombre +
                        '</a></li>'
                );
            });
        });
}
async function addContacto(contactMail) {
    console.log(contactMail);
    var doc = await getUserData(contactMail);
    if (doc.exists) {
        db.collection('USUARIOS')
            .doc(contactMail)
            .collection('CONTACTOS')
            .doc(userMail)
            .set({ nombre: userName });
        db.collection('USUARIOS')
            .doc(userMail)
            .collection('CONTACTOS')
            .doc(doc.id)
            .set({ nombre: doc.data().nombre });
        showError('El usuario se ha agregado de forma correcta');
        router.back();
    } else {
        showError('El usuario no existe');
    }
}
function mostrarArchivos() {
    $$('#fileList').html('');
    files.forEach((archivo) => {
        $$('#fileList').append(
            `<li><div class="item-content"><div class="item-inner"> <div class="item-title">` +
                archivo.name +
                `</div> <a id="` +
                archivo.name +
                `" onclick="deleteFile('` +
                archivo.name +
                `')" class="fileId f7-icons size-50"> xmark_circle </a> </div> </div></li>`
        );
    });
}
function deleteFile(archivo) {
    console.log(archivo);
    files = files.filter((file) => {
        return file.name != archivo;
    });
    mostrarArchivos();
}
function downloadFile(name, url) {
    if (device.platform != 'browser') {
        app.dialog.preloader('Descargando archivo');
        console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function (event) {
            var blob = xhr.response;
            console.log(name, blob);
            //blob tiene el contenido de la respuesta del servidor
            saveFile(name, blob);
        };
        xhr.open('GET', url);
        xhr.send();
    } else {
        window.open(url, '_system');
    }
}
function saveFile(name, blob) {
    window.requestFileSystem(
        LocalFileSystem.PERSISTENT,
        0,
        (fs) => {
            //abrimos el sistema de archivos
            console.log('file system open: ' + fs.name);
            window.resolveLocalFileSystemURL(
                cordova.file.externalRootDirectory,
                (dirEntry) => {
                    //vamos a la raiz del sistema '/'
                    console.log('root ', dirEntry);
                    dirEntry.getDirectory(
                        'Download',
                        { create: true, exclusive: false },
                        (dirEntry) => {
                            //vamos a la carpeta download
                            console.log('downloads ', dirEntry);
                            dirEntry.getFile(
                                name,
                                { create: true, exclusive: false },
                                (fileEntry) => {
                                    writeFile(fileEntry, blob);
                                    //llamamos a la function writeFile y le pasamos el archivo a guardar
                                },
                                (err) => {
                                    showError('Error al descargar el archivo');
                                    console.log('failed to create file');
                                    console.log(err);
                                }
                            );
                        },
                        () => {
                            showError('Error al descargar el archivo');
                            console.log(err);
                        }
                    );
                },
                () => {
                    app.dialog.close();
                    showError('Error al descargar el archivo');
                }
            );
        },
        (err) => {
            showError('Error al descargar el archivo');
            console.log(err);
        }
    );
}
function writeFile(fileEntry, dataObj) {
    fileEntry.createWriter((fileWriter) => {
        fileWriter.onwriteend = () => {
            console.log('Successful file write...');
            console.log('type ' + dataObj.type);
            cordova.plugins.fileOpener2.open(fileEntry.toURL(), dataObj.type);
            app.dialog.close();
        };

        fileWriter.onerror = (e) => {
            console.log('Failed file write: ' + e.toString());
            app.dialog.close();
            showError('Error al descargar el archivo');
        };

        fileWriter.write(dataObj);
    });
}
async function getTransacciones() {
    db.collection('TRANSACCIONES')
        .where('usuarios', 'array-contains', userMail)
        .limit(50)
        .onSnapshot(async (querySnapshot) => {
            var docs = querySnapshot.docChanges();
            docs.sort((a, b) => {
                if (a.doc.data().timeStamp > b.doc.data().timeStamp) return 1;
                if (a.doc.data().timeStamp < b.doc.data().timeStamp) return -1;
                return 0;
            });
            docs.forEach(async (change) => {
                var doc = change.doc;
                var transaccionId = doc.id;
                $$('#lista-notificaciones').prepend(
                    `<li><a id='${transaccionId}' class='panel-close' href='/transaccion/${transaccionId}'></li>`
                );
                if (doc.data().usuarios[0] == userMail) {
                    var id = doc.data().usuarios[1];
                    var contacto = await getUserData(id);
                    var contactName = contacto.data().nombre;
                    $$('#' + transaccionId).text('De ti a ' + contactName);
                } else {
                    $$('#badge').addClass('badge');
                    var id = doc.data().usuarios[0];
                    var contacto = await getUserData(id);
                    var contactName = contacto.data().nombre;
                    $$('#' + transaccionId).text('De ' + contactName + ' a ti');
                }
            });
        });
}
