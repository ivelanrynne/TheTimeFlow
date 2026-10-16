import jwt from "jsonwebtoken";
import User from "../models/User.js";

// authorization middleware
export const protectedRoute = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader.slice(7).trim();
        if (!authHeader || !authHeader.startsWith("Bearer ") || !token) {
            return res
                .status(401)
                .json({ message: "Authorization header missing or malformed." });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find user in database
        const user = await User.findById(decoded.userId).select("-hashedPassword");
        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found." });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ message: "Invalid or expired token." });
        }

        return res
            .status(500)
            .json({ message: "Internal server error." });
    }
};