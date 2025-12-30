import * as userService from './user.service.js';

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers({ id: req.user._id.toString(), role: req.user.role });
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
        const user = await userService.createUser(req.body, { id: req.user._id.toString(), role: req.user.role });
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
        const user = await userService.updateUser(
            req.params.id,
            req.body,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const result = await userService.deleteUser(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const user = await userService.getUser(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
