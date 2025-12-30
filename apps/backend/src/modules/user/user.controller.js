import * as userService from './user.service.js';

export const getUsers = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to access this resource' });
        }
        const users = await userService.getUsers();
        console.log("users fetched: ", users);
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to create users' });
        }
        const user = await userService.createUser(req.body);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'You are not authorized to update this user' });
        }
        const user = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this user' });
        }
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'You are not authorized to access this user' });
        }
        const user = await userService.getUser(req.params.id);
        console.log("user fetched: ", user);
        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};
