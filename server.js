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
  STOPGROUPNAME: { type: String, required: true },
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
      const { name, macAddress, number_plate, STOPGROUPNAME } = bus;

      if (!name || !macAddress || !Array.isArray(macAddress) || !number_plate || !STOPGROUPNAME) {
        return res.status(400).json({
          error: 'Each bus must have "name", "macAddress" (array), "number_plate", and "STOPGROUPNAME".',
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
        existingBus.STOPGROUPNAME = STOPGROUPNAME;
        await existingBus.save();
      } else {
        // Add a new bus entry
        const newBus = new Bus({
          name,
          macAddresses: macAddress,
          number_plate,
          STOPGROUPNAME,
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

// PUT API to update bus details by name
app.put('/update-bus-details/:name', async (req, res) => {
  const { name } = req.params;
  const { macAddresses, number_plate, STOPGROUPNAME } = req.body;

  if (!macAddresses || !Array.isArray(macAddresses) || !number_plate || !STOPGROUPNAME) {
    return res.status(400).json({
      error: '"macAddresses" (array), "number_plate", and "STOPGROUPNAME" are required.',
    });
  }

  try {
    const bus = await Bus.findOne({ name });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    bus.macAddresses = macAddresses;
    bus.number_plate = number_plate;
    bus.STOPGROUPNAME = STOPGROUPNAME;

    await bus.save();
    return res.status(200).json({ message: 'Bus details updated successfully', bus });
  } catch (error) {
    console.error('Error updating bus details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE API to remove a bus by name
app.delete('/delete-bus/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const bus = await Bus.findOneAndDelete({ name });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    return res.status(200).json({ message: 'Bus deleted successfully', bus });
  } catch (error) {
    console.error('Error deleting bus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log('Server running at http://localhost:${port}');
});


