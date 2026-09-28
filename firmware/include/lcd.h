#pragma once

#include <Arduino.h>

// Inicializa el LCD 16x2 mediante I2C
void lcd_init();

// Actualiza la información mostrada en el LCD
void lcd_show(float soilMoisture, float phValue, float temperature,
              float airHumidity, bool pumpState, bool waterLevelOk);