#ifdef ARDUINO_ARCH_ESP32
#include <WiFi.h>
#include <WiFiMulti.h>
WiFiMulti wifiMulti;
#else
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
ESP8266WiFiMulti wifiMulti;
#endif

#include <MQTT.h>
#include <Servo.h>

//Variables de nombre y contraseña de red inalámbrica
const char ssid1[] = "ALSW";
const char pass1[] = "25264897";
const char ssid2[] = "ALSW2";
const char pass2[] = "7210-3607";
const char ssid3[] = "ssid";
const char pass3[] = "pass";

//Variables para conexion a WiFi y para la conexion MQTT
WiFiClient net;
MQTTClient client;

//Variables del brazo de servomotores
unsigned long lastMillis = 0;
Servo brazo_base;
Servo brazo_superior;

//Funcion de conexion del modulo WiFi a la red y conexion al servicio MQTT
void Conectar() {
  Serial.print("Conectando a Wifi...");
  while (wifiMulti.run() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.print("\nConectado a MQTT...");

  while (!client.connect("FullIOTNeurona", "gibadrian1", "usercontra1")) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nConectado MQTT!");

  client.subscribe("/Seguridad/deteccion");
}

//Funcion que recibe los mensajes del servicio MQTT
void RecibirMQTT(String &topic, String &payload) {
  Serial.println("Recibio: " + topic + " - " + payload);
  
  if (payload == "Persona") {    
    Serial.println("¡CUIDADO! Hay una persona en el perímetro.");  
    Serial.println("El brazo quedará inmovil hasta que la persona abandone el area");  
    brazo_base.write(0);
    brazo_superior.write(0);
    
  } else if (payload == "Animal") {    
    Serial.println("¡CUIDADO! Hay un animal en el perímetro.");  
    Serial.println("El brazo quedará inmovil hasta que el animal abandone el area");  
    brazo_base.write(0);
    brazo_superior.write(0);
        
  } else if (payload == "Nada") {
    
    {
      Serial.println("Giro de la base");  
      brazo_base.write(0);
      Serial.println("Base en 0°");  
      delay(2000);
      brazo_base.write(90);
      Serial.println("Base en 90°");
      delay(3000);
    }
    
    {
      Serial.println("Giro superior"); 
      brazo_superior.write(0);
      Serial.println("Superior en 0°");
      delay(2000);
      brazo_superior.write(90);
      Serial.println("Superior en 90°");
      delay(4000);
    }
    
  }
}

//Funcion para inicializar las variables
void setup() {
  Serial.begin(115200);
  brazo_base.attach(4);
  brazo_superior.attach(2);
  Serial.println("Iniciando Wifi");
  WiFi.mode(WIFI_STA);//Cambiar modo del Wi-Fi
  delay(100);
  wifiMulti.addAP(ssid1, pass1);
  wifiMulti.addAP(ssid2, pass2);
  wifiMulti.addAP(ssid3, pass3);

  client.begin("broker.shiftr.io", net);
  client.onMessage(RecibirMQTT);

  Conectar();
}

//Funcion ciclica, repite todos los procesos 
void loop() {
  client.loop();
  delay(10);
  if (!client.connected()) {
    Conectar();
  }
}
