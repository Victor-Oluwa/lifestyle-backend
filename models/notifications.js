const mongoose = require("mongoose");
const notificationSchema = mongoose.Schema({
    image: {
        type: String,
        default: ""
    },
    title: {
        type: String,
        default: ""
    },
    message: {
        type: String,
        default: ""
    },
    action: {
        type: String,
        default: ""
    },

});

const Notifications = mongoose.model('Notifications', notificationSchema);
module.exports = { Notifications, notificationSchema };
