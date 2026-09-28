#include "lcd.h"
#include "../config/config.h"
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// Dirección I2C detectada en nuestro módulo
#define LCD_I2C_ADDRESS 0x27

// LCD de 16 columnas x 2 filas
static LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, 16, 2);

// Pantalla actualmente mostrada
static uint8_t _currentScreen = 0;

// Tiempo de cambio entre pantallas
static unsigned long _lastScreenChangeMs = 0;

// Cambiar de pantalla cada 3 segundos
#define LCD_SCREEN_INTERVAL_MS 3000

void lcd_init() {
  Serial.println("[LCD] Inicializando LCD 16x2...");

  // Iniciar comunicación I2C
  Wire.begin(PIN_LCD_SDA, PIN_LCD_SCL);

  // Inicializar LCD
  lcd.init();
  lcd.backlight();

  // Pantalla inicial
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("   SMARTGARDEN");
  lcd.setCursor(0, 1);
  lcd.print("   Iniciando...");

  _currentScreen = 0;
  _lastScreenChangeMs = millis();

  Serial.println("[LCD] LCD inicializado correctamente.");
}

void lcd_show(float soilMoisture, float phValue, float temperature,
              float airHumidity, bool pumpState, bool waterLevelOk) {

  unsigned long now = millis();

  // Cambiar de pantalla cada 3 segundos
  if (now - _lastScreenChangeMs >= LCD_SCREEN_INTERVAL_MS) {
    _lastScreenChangeMs = now;

    _currentScreen++;

    if (_currentScreen > 3) {
      _currentScreen = 0;
    }

    lcd.clear();
  }

  switch (_currentScreen) {

  // ------------------------------------------------------
  // PANTALLA 0: HUMEDAD DEL SUELO
  // ------------------------------------------------------
  case 0:
    lcd.setCursor(0, 0);
    lcd.print("Humedad suelo:");

    lcd.setCursor(0, 1);
    lcd.print(soilMoisture, 0);
    lcd.print("%");
    break;

  // ------------------------------------------------------
  // PANTALLA 1: ESTADO DEL RIEGO
  // ------------------------------------------------------
  case 1:
    lcd.setCursor(0, 0);
    lcd.print("Riego:");

    lcd.setCursor(0, 1);

    if (pumpState) {
      lcd.print("ACTIVO");
    } else {
      lcd.print("APAGADO");
    }
    break;

  // ------------------------------------------------------
  // PANTALLA 2: TEMPERATURA Y HUMEDAD AMBIENTE
  // ------------------------------------------------------
  case 2:
    lcd.setCursor(0, 0);
    lcd.print("Temp: ");
    lcd.print(temperature, 1);
    lcd.print((char)223);
    lcd.print("C");

    lcd.setCursor(0, 1);
    lcd.print("Hum. aire: ");
    lcd.print(airHumidity, 0);
    lcd.print("%");
    break;

  // ------------------------------------------------------
  // PANTALLA 3: pH Y NIVEL DE AGUA
  // ------------------------------------------------------
  case 3:
    lcd.setCursor(0, 0);
    lcd.print("pH: ");
    lcd.print(phValue, 2);

    lcd.setCursor(0, 1);

    if (waterLevelOk) {
      lcd.print("Agua: OK");
    } else {
      lcd.print("Agua: BAJO");
    }
    break;
  }
}