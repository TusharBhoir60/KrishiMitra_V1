import { getFrmerStats } from '../utils/farmerStats.js';

const getFarmerProfile = async (req, res) => {
    try{
        const farmer = await User.findById(req.params.farmerId).lean();
    if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });

    // ← Add these two lines
    const { avgRating, totalReviews } = await getFarmerStats(farmer._id);

    return res.status(200).json({
      farmer: {
        ...farmer,
        avgRating,      // ← now included in the response
        totalReviews,   // ← now included in the response
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};