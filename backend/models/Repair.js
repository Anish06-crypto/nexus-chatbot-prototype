const mongoose = require('mongoose');

const RepairSchema = new mongoose.Schema({
    reference: {
        type: String,
        required: true,
        unique: true
    },
    issue_type: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['CRITICAL', 'EMERGENCY', 'URGENT', 'ROUTINE'],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    photo_uri: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Submitted', 'Assigned', 'In Progress', 'Completed'],
        default: 'Submitted'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Repair', RepairSchema);