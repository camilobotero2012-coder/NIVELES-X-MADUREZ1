const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB = process.env.MONGODB_DB || 'evaluacionMadurez';
const MONGO_COLLECTION = process.env.MONGODB_COLLECTION || 'resultados';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let collection;

async function initMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  collection = db.collection(MONGO_COLLECTION);
  await collection.createIndex({ empresa: 1 }, { name: 'empresa_index' });
  console.log('✅ MongoDB conectado:', MONGO_URI, MONGO_DB, MONGO_COLLECTION);
}

app.post('/guardar-resultados', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.empresa || typeof payload.puntajeTotal !== 'number' || !payload.nivel || !Array.isArray(payload.dimensiones)) {
      return res.status(400).json({ success: false, error: 'Payload inválido. Verifica empresa, puntajeTotal, nivel y dimensiones.' });
    }

    const documento = {
      empresa: payload.empresa,
      fecha: payload.fecha ? new Date(payload.fecha) : new Date(),
      puntajeTotal: payload.puntajeTotal,
      nivel: payload.nivel,
      dimensiones: payload.dimensiones.map(dim => ({
        nombre: dim.nombre,
        porcentaje: Number(dim.porcentaje) || 0
      })),
      guardadoEn: new Date()
    };

    const result = await collection.insertOne(documento);
    return res.status(201).json({ success: true, result: { ...documento, _id: result.insertedId } });
  } catch (error) {
    console.error('Error POST /guardar-resultados:', error);
    return res.status(500).json({ success: false, error: 'Error interno guardando resultados.' });
  }
});

app.get('/resultados', async (req, res) => {
  try {
    const empresa = req.query.empresa || '';
    const filtro = empresa
      ? { empresa: { $regex: empresa, $options: 'i' } }
      : {};

    const resultados = await collection
      .find(filtro)
      .project({ empresa: 1, fecha: 1, puntajeTotal: 1, nivel: 1 })
      .sort({ fecha: -1 })
      .toArray();

    return res.json({ success: true, results: resultados });
  } catch (error) {
    console.error('Error GET /resultados:', error);
    return res.status(500).json({ success: false, error: 'Error interno consultando resultados.' });
  }
});

app.get('/resultados/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido.' });
    }

    const registro = await collection.findOne({ _id: new ObjectId(id) });
    if (!registro) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado.' });
    }

    return res.json({ success: true, result: registro });
  } catch (error) {
    console.error('Error GET /resultados/:id:', error);
    return res.status(500).json({ success: false, error: 'Error interno consultando el registro.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initMongo()
  .then(() => app.listen(PORT, () => console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`)))
  .catch(error => {
    console.error('No fue posible iniciar el servidor:', error);
    process.exit(1);
  });
