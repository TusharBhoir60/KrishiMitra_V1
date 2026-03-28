import dotenv from 'dotenv';
dotenv.config({
    path: "./.env"
});

import { app } from './src/app.js';
import connectDB from './src/config/db.js';
import { Order } from './src/models/order.js';
import { CropListing } from './src/models/croplisting.js';
import { notifyOrderExpired } from './src/services/notificationService.js';

const port = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // Auto-release held payments every hour.
        setInterval(async () => {
            try {
                const now = new Date();

                await Order.updateMany(
                    { 'payment.autoReleaseAt': { $lt: now }, 'payment.status': 'held' },
                    { 'payment.status': 'released', 'payment.releasedAt': now }
                );
            } catch (err) {
                console.error('Auto-release job error:', err.message);
            }
        }, 60 * 60 * 1000);

        // Expire pending orders frequently so inventory can return quickly.
        setInterval(async () => {
            try {
                const now = new Date();

                const expiredOrders = await Order.find({
                    status: 'pending',
                    acceptanceDeadline: { $lt: now }
                });

                for (const order of expiredOrders) {
                    order.status = 'expired';
                    await order.save();

                    const listing = await CropListing.findById(order.cropListing);
                    if (listing) {
                        listing.availableQty += order.orderDetails.quantity;
                        if (listing.status === 'sold_out') listing.status = 'active';
                        await listing.save();
                    }

                    await notifyOrderExpired(order.farmer, order.orderDetails.cropName, order._id);
                    await notifyOrderExpired(order.buyer, order.orderDetails.cropName, order._id);
                }
            } catch (err) {
                console.error('Order-expiry job error:', err.message);
            }
        }, 5 * 60 * 1000);
    })
    .catch((err) => {
        console.error("Failed to connect to the database", err);
    });