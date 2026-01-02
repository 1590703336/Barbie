import * as userService from './user.service.js';
import { assertAdmin, assertSameUserOrAdmin } from '../../utils/authorization.js';

export const getUsers = async (req, res, next) => {
    try {
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertAdmin(requester, 'access users list');

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
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertAdmin(requester, 'create users');

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
        const targetUserId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'update this user');

        const user = await userService.updateUser(targetUserId, req.body);
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
        const targetUserId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'delete this user');

        const result = await userService.deleteUser(targetUserId);
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
        const targetUserId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access this user');

        const user = await userService.getUser(targetUserId);
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
