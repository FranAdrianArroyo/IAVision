var Camara;
var Detecta;
var BotonesEntrenar;
var knn;
var modelo;
var Texto;
var Clasificando = false;

let BrokerMQTT = 'broker.shiftr.io';
let PuertoMQTT = 80;
let ClienteIDMQTT = "MQTT-P5";
let UsuarioMQTT = "gibadrian1";
let ContrasenaMQTT = "usercontra1";

client = new Paho.MQTT.Client(BrokerMQTT, PuertoMQTT, ClienteIDMQTT);

// Funciones de callback
client.onConnectionLost = MQTTPerder;
client.onMessageArrived = MQTTMensaje;

// conexion al cliente
client.connect({
  onSuccess:CuandoConectadoMQTT,
  userName:UsuarioMQTT,
  password:ContrasenaMQTT
});

// Funcion de perdida de conexion
function MQTTPerder(responseObject) {
  if (responseObject.errorCode !== 0) {
    return console.log("Perdió conexión. Error: "+responseObject.errorMessage);
  }
}

// Funcion de mensaje recibido
function MQTTMensaje(message) {
  return console.log("Mensaje recibido: "+message.payloadString);
}

// Funcion de conexion exitosa
function CuandoConectadoMQTT() {
  // Once a connection has been made, make a subscription and send a message.
  return console.log("MQTT Conectado");
}

//Declaramos e iniciamos variables a utilizar
function setup() {
  var ObtenerCanva = document.getElementById('micanva');
  Detecta = document.getElementById('Detecta');
  var sketchCanvas = createCanvas(320, 250);
  sketchCanvas.parent("micanva");
  Camara = createCapture(VIDEO);
  Camara.hide();

  modelo = ml5.featureExtractor('MobileNet', ModeloListo);
  knn = ml5.KNNClassifier();

  var CargarBoton = select("#CargarBoton");
  CargarBoton.mousePressed(CargarNeurona);
}

//Dibuja el espacio para la camara
function draw() {
  image(Camara, 0, 0, width * Camara.width / Camara.height, width);

  if(knn.getNumLabels() > 0 && !Clasificando){
    setInterval(clasificar, 500);
    Clasificando = true;
  }
}

//Funcion de verificacion de modelo
function ModeloListo(){
  return console.log("Modelo Listo");
}

//Funcion clasificadora de imagenes capturadas por la camara
function clasificar(){
  if(Clasificando){
    const Imagen = modelo.infer(Camara);
    knn.classify(Imagen, function(error, result){
      if(error){
        console.error();
      } else{

        Etiquetas = Object.keys(result.confidencesByLabel);
        Valores = Object.values(result.confidencesByLabel);
        var Indice = 0;

        for (var i = 0; i < Valores.length; i++) {
          if (Valores[i] > Valores[Indice]) {
            Indice = i;
          }
        }
        Detecta.innerText = "La camara detectó un: " + Etiquetas[Indice];
        message = new Paho.MQTT.Message(Etiquetas[Indice]);
        message.destinationName = "Seguridad/deteccion";
        client.send(message);
      }
    });
  }
}

//Funcion para cargar la neurona entrenada
function CargarNeurona() {
  console.log("Cargando una Neurona");
  knn.load("./NeuronaKNN.json", function() {
    console.log("Neurona Cargada knn");
  })
}
