const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb+srv://qwatdev:Qwat2024@bibo.klzm9.mongodb.net/?retryWrites=true&w=majority&appName=bibo'; // Replace with your MongoDB URI
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// MongoDB Schema and Model
const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  macAddresses: { type: [String], required: true },
  number_plate: { type: String, required: true },
});

const Bus = mongoose.model('Bus', busSchema);

// POST API to add or update bus details
app.post('/add-bus-details', async (req, res) => {
  const { Bus: busArray } = req.body;

  if (!busArray || !Array.isArray(busArray)) {
    return res
      .status(400)
      .json({ error: 'The "Bus" field is required and should be an array of bus objects.' });
  }

  try {
    for (const bus of busArray) {
      const { name, macAddress, number_plate } = bus;

      if (!name || !macAddress || !Array.isArray(macAddress) || !number_plate) {
        return res.status(400).json({
          error: 'Each bus must have "name", "macAddress" (array), and "number_plate".',
        });
      }

      // Check if the bus already exists by name
      const existingBus = await Bus.findOne({ name });

      if (existingBus) {
        // Update existing bus details
        existingBus.macAddresses = [
          ...new Set([...existingBus.macAddresses, ...macAddress]),
        ];
        existingBus.number_plate = number_plate;
        await existingBus.save();
      } else {
        // Add a new bus entry
        const newBus = new Bus({
          name,
          macAddresses: macAddress,
          number_plate,
        });
        await newBus.save();
      }
    }

    const updatedBusData = await Bus.find();
    return res
      .status(200)
      .json({ message: 'Bus details added/updated successfully', updatedBusData });
  } catch (error) {
    console.error('Error saving bus details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST API to fetch bus details by multiple MAC addresses
app.post('/get-bus-details', async (req, res) => {
  const { macAddresses } = req.body;

  if (!macAddresses || !Array.isArray(macAddresses)) {
    return res.status(400).json({ error: '"macAddresses" is required and should be an array' });
  }

  try {
    const busDetails = await Bus.find({ macAddresses: { $in: macAddresses } });

    if (busDetails.length > 0) {
      return res.status(200).json({ buses: busDetails });
    } else {
      return res.status(404).json({ error: 'No buses found for the provided MAC addresses' });
    }
  } catch (error) {
    console.error('Error fetching bus details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
