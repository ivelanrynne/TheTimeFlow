import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = '30m'; // 30 minutes

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

export const signUp = async (req, res) => {
    try {
        const { username, password, email, displayName } = req.body;

        if (!username || !password || !email || !displayName) {
            return res
                .status(400)
                .json({ message: "Username, password, email, and displayName are required." });
        }

        const duplicateUser = await User.findOne({ $or: [{ username }, { email }] });

        if (duplicateUser) {
            return res
                .status(409)
                .json({ message: "Username or email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            hashedPassword,
            email,
            displayName
        });

        return res
            .status(201)
            .json({ message: "User registered successfully." });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred during registration.", error: error.message });
    }
}

export const signIn = async (req, res) => {
    try {
        // Get inputs
        const { username, password } = req.body;

        // Validate inputs
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password are required." });
        }

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found." });
        }

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ message: "Invalid password." });
        }

        // Generate JWT token
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');

        // Store refresh token in the database
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL) // 14 days
        });

        // give refresh token to cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Set to true if using HTTPS
            sameSite: 'Strict', // Adjust based on your needs
            maxAge: REFRESH_TOKEN_TTL, // 14 days
        });

        // give accesss token to response
        return res
            .status(200)
            .json({ message: `${user.displayName} logged in successfully.`, accessToken });
        
    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred during login.", error: error.message });
    }
}

export const signOut = async (req, res) => { 
    try {
        // Get refresh token from cookies
        const token = req.cookies?.refreshToken;

        if (token) {
            // romove refresh token from database
            await Session.deleteOne({ refreshToken: token });

            // clear the cookie
            res.clearCookie('refreshToken');
        }

        return res
            .status(200)
            .json({ message: "User logged out successfully." });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred during logout.", error: error.message });
    }
}