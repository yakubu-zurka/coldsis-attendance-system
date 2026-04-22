const Excuse = require('../models/Excuse');

// @desc    Submit an absence excuse
// @route   POST /api/excuses
// @access  Public (PIN validated on frontend)
const submitExcuse = async (req, res) => {
  try {
    const { staffId, staffName, date, reason } = req.body;

    if (!staffId || !staffName || !date || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const excuse = await Excuse.create({
      staffId,
      staffName,
      date,
      reason
    });

    res.status(201).json(excuse);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An excuse has already been submitted for this staff today.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all excuses
// @route   GET /api/excuses
// @access  Private/Admin
const getExcuses = async (req, res) => {
  try {
    const excuses = await Excuse.find({}).sort({ timestamp: -1 });
    res.json(excuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an excuse
// @route   DELETE /api/excuses/:id
// @access  Private/Admin
const deleteExcuse = async (req, res) => {
  try {
    const excuse = await Excuse.findById(req.params.id);
    if (excuse) {
      await excuse.deleteOne();
      res.json({ message: 'Excuse removed' });
    } else {
      res.status(404).json({ message: 'Excuse not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitExcuse,
  getExcuses,
  deleteExcuse
};
