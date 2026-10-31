const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-garden-60bf2-default-rtdb.firebaseio.com",
});

const db = getDatabase();

async function testFirebase() {
  try {
    const snapshot = await db
      .ref("/smartgarden/sensors/current")
      .once("value");

    console.log("======================================");
    console.log("  SmartGarden - Prueba Firebase");
    console.log("======================================");

    if (snapshot.exists()) {
      console.log("Lectura Firebase exitosa:");
      console.log(snapshot.val());
    } else {
      console.log("La ruta existe pero no contiene datos.");
    }
  } catch (error) {
    console.error("Error al leer Firebase:");
    console.error(error);
  }
}

testFirebase();