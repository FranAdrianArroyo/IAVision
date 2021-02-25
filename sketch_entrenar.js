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

// Conexion al cliente
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

// called when a message arrives
function MQTTMensaje(message) {
  return console.log("Mensaje recibido: "+message.payloadString);
}

// Funcion de mensaje recibido
function CuandoConectadoMQTT() {
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

  BotonesEntrenar = selectAll(".BotonEntrenar");
  for (var B = 0; B < BotonesEntrenar.length; B++) {
    BotonesEntrenar[B].mousePressed(PresionandoBoton);
  }

  var SalvarBoton = select("#SalvarBoton");
  SalvarBoton.mousePressed(GuardarNeurona);
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
  console.log("Modelo Listo");
  return true;
}

//Funcion que recibe la informacion de la camara para entrenar la neurona
function EntrenarKnn(ObjetoEntrenar){
  const Imagen = modelo.infer(Camara);
  return knn.addExample(Imagen, ObjetoEntrenar);
}

//Funcion que recibe la informacion del boton presionado
function PresionandoBoton(){
  var NombreBoton = this.elt.innerHTML;
  console.log("Entrenando con "+ NombreBoton);
  return EntrenarKnn(NombreBoton);
}

//Funcion que clasifica las imagenes recibidas
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

//Funcion para guardar la neurona entrenada
function GuardarNeurona() {
  if (Clasificando) {
    console.log("Guardando la neurona");
    knn.save("NeuronaKNN");
  }
}

//Funcion para cargar la neurona
function CargarNeurona() {
  console.log("Cargando una Neurona");
  knn.load("./NeuronaKNN.json", function() {
    console.log("Neurona Cargada knn");
  })
}
