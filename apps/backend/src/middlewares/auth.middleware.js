import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import * as userRepository from '../modules/user/user.repository.js';

const authorize = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userRepository.findById(decoded.userId);

        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        console.log("user authorized: ", user);
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            message: 'Unauthorized',
            error: error.message
        });
    }
}

export default authorize;