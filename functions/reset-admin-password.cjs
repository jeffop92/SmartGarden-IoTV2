const admin = require('firebase-admin');
const readline = require('readline');

admin.initializeApp({
  projectId: 'smart-garden-60bf2'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Nueva contraseña para admin@smartgarden.com: ', async (password) => {
  try {
    const user = await admin.auth().getUserByEmail('admin@smartgarden.com');

    await admin.auth().updateUser(user.uid, {
      password: password
    });

    console.log('Contraseña actualizada correctamente.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
});