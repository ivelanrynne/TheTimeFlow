export const authMe = async (req, res) => { 
    try {
        const user = req.user;

        return res
            .status(200)
            .json({ message: "User data fetched successfully.", user });

    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred while fetching user data.", error: error.message });
    }
}

export const test = async (req, res) => {
    try {
        return res
            .status(204)
            .json({ message: "Test route is working!" });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred in the test route.", error: error.message });
    }
}